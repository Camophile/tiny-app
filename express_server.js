const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const bcrypt = require('bcrypt');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

app.disable('etag');//troubleshooting for "304" redirects instead of 200

const usersDatabase = { //add two users and give one to each stored URL
  "a2a8dd": {
    id: "a2a8dd",
    email: "test@email.com",
    password: "password"
  },
  "y51qm9c": {
    id:"y51qm9c",
    email: "karl@gmail.com",
    password: "karl"
  }
};

const urlDatabase = {'b2xVn2': {longURL: 'http://www.lighthouselabs.ca',
                              creator: 'a2a8dd'
                             },
                  '9sm5xk': {longURL: 'http://www.google.com',
                              creator: 'y51qm9c'}
                  };

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  secret: 'mykey'
}));


app.use(function(req, res, next){ //defines userID global objects
                                  //accessible to templates
  if(req.session.userID){
     res.locals.user = usersDatabase[req.session.userID]; //usersDatabase[req.cookie.userID];
     res.locals.urls = urlDatabase;
     next();
  }
  else{
     next();
  }

});

function generateRandomString() {
  var text = "";
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 6; i++ ) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
}

function isFieldBlank(email, password){

  if(!email){
    return true;
  }
  if(!password){
    return true;
  } else{
    return false;
  }
}

function doesEmailExist(email, userData){
  for(let id in userData){
    if(userData[id]["email"] === email){
      return true;
    }
  }
  return false;
}

function getIdByEmail(email) {
  for(let id in usersDatabase) {
    if(email === usersDatabase[id]["email"]){
      return id;
    }
  }
  return null;
}

// check this because it will look at all user passwords
function doesPasswordMatch(password, userData) {
  for(let id in userData) {
    if(password === userData[id]["password"]) {
      return true;
    }
  }
  return false;
}

function checkLoggedIn(req, res, next) {
  if(req.session.userID) {
    next();
  }else{
    res.status(401).send('User must be <a href="/login">logged in</a>');
  }
}

// function ownsDatabase(req, res, next){
//   let filteredUrls = {}
//   let userID = req.session.userID;
//   console.log("From ownsDatabase(): userID = ", userID)

//   for(let id in res.locals.urls){
//     if(res.locals.urls[id].creator === userID){ //if the user (creator) exists in urlsDatabase
//       filteredUrls[id] = res.locals.urls[id]; //gives the current user an object of urls they own
//       next();
//     }else{ //if try to access url they don't own, sends error message
//       res.status(403).send(`<html>Does not exist! <a href="/urls">Back to links</a></html>`)
//     }
//   }
// }

app.get('/', (req, res) => {//Redirect to /urls if logged in, if not --> /login
  if(req.session.userID) { //if user logged in
    res.redirect('/urls');//redirect to /urls
  } else {
    res.redirect('/login'); // redirect to /login
  }
});

app.get('/urls', checkLoggedIn, (req, res) => { //loop through urlDatabase to see if userID
                                //in that spot matches the req.body.id

  // we have a full list of all urls
  // we need to loop through list of urls
  // for each url check to see if the creator is the same as the current user
  let filteredUrls = {}
  let userID = req.session.userID;

  for(let id in res.locals.urls){
    if(res.locals.urls[id].creator === userID){ //if the user (creator) exists in urlsDatabase
      filteredUrls[id] = res.locals.urls[id]; //gives the current user an object of urls they own
    }
  }

  console.log("FilteredUrls in /urls: ", filteredUrls);

  let templateVars = {
    urls: filteredUrls
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", checkLoggedIn, (req, res) => {
  res.render("urls_new");
});

app.get('/urls/:id', checkLoggedIn, (req, res) => {

if(urlDatabase[req.params.id].creator !== req.session.userID){
    return res.status(403).send(`<html>Does not exist! <a href="/urls">Back to links</a></html>`);
  }

if(!urlDatabase[req.params.id]){
  return res.status(404).send(`resource ${req.params.id} not found`);
  }

let templateVars = {
  shortURL: req.params.id, // was req.params.id
  longURL: urlDatabase[req.params.id].longURL
};

return res.render('urls_show', templateVars);
});

// app.post("/urls/create", (req, res) => {
app.post("/urls", (req, res) => {

   if(!req.session.userID){
    res.redirect("/login")
    return;
  }

  var URL = req.body.longURL
  if(!URL.startsWith('http')){
    URL = 'http://' + req.body["longURL"];
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: URL,
                            creator: req.session.userID //**req.session.user_ID**
                            };

  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
})

app.post("/urls/:id/delete", checkLoggedIn, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/');
});

app.post("/urls/:id", (req, res) => {
  console.log("POST /urls/id");
  console.log("urlDatabase[req.params.id].creator:", urlDatabase[req.params.id].creator);
  console.log("req.session.userID:", req.session.userID);

  var URL = req.body.longURL
  if(!URL.startsWith('http')){
    URL = 'http://' + req.body["longURL"];
    console.log("no http");
  }

  // console.log("FilteredUrls in urls/:id: ", filteredUrls);

  urlDatabase[req.params.id].longURL = URL;
  console.log("yes http");
  res.redirect('/urls/' + req.params.id);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // go through all users and find the email that the user input
  // if not found then status 401
  // if found check password for user against password the user input
  // if not matching then status 401
  // if matching then log user in and redirect to '/'

  let userID = getIdByEmail(email);

  req.session.userID = userID;
  console.log(req.session.userID);

  if(!req.session.userID && !bcrypt.compareSync(password, usersDatabase[userID].password)) {
  //if(!req.session.userID){
    res.status(401);
    res.send('Unable to login.');
    return;
  }

  // this happens if user has input valid email and password
  // res.cookie("userID", userID);
  // res.session("userID", userID);
  res.redirect('/');
});

app.get("/login", (req, res) => {
  res.render("user_login");
})

app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect('/urls')
});

app.get("/register", (req, res) => {
  res.render("user_registration")
});

app.post("/register", (req, res) => {
  let id = generateRandomString();

  let email = req.body["email"];
  let password = req.body["password"];

  console.log("Typed password", password);

  if(isFieldBlank(email, password)){
    res.status(400).send("Email and/or password field is empty");
    return;
  }
  if(doesEmailExist(email, usersDatabase)){
    res.status(400).send("email already registered");
    return;
  }

  let hashed_password = bcrypt.hashSync(password, 10);
  console.log("Hashed password", hashed_password);

  // res.cookie("userID", id);
  req.session.userID = id;

  usersDatabase[id] = {
    id: id,
    email: email,
    password: hashed_password
  };

  console.log("usersDatabase[id].password", usersDatabase[id].password);

  res.redirect("/")
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} \n`);
});