const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(function(req, res, next){ //defines userID global objects
                                  //accessible to other routes
  res.locals.user = usersDatabase[req.cookies["userID"]];
  next();
});

var usersDatabase = {"a2a8dd": {id: "a2a8dd", email: "test@email.com", password: "password"}};

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xk': 'http://www.google.com'
};

function generateRandomString() {
  var text = "";
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 6; i++ )
    text += charset.charAt(Math.floor(Math.random() * charset.length));
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

function doesPasswordMatch(password, userData){
  for(let id in userData){
    if(password === userData[id]["password"]){
      return true;
    }
  }
  return false;
}

app.get('/', (req, res) => {
  res.redirect("/urls");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render('urls_show', templateVars);
});

app.post("/urls/create", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body["longURL"];
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(`http://${longURL}`);
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/');
});

app.post("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  urlDatabase[req.params.id] = req.body["longURL"];
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if(!doesEmailExist(email, usersDatabase)){
    res.status(403).send("Ain't so sunshine when she's gone")
    return;
  }
  if(!doesPasswordMatch(password, usersDatabase)){
    res.status(403).send("You Shall Not Pass!");
    return;
  }

  for(var id in usersDatabase){
    if(req.body.email === usersDatabase[id]["email"]){
      var userID = id;
    }
  }

  res.cookie("userID", userID);
  console.log(userID);
  console.log(usersDatabase);
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.cookie("userID");
  res.cookie("email")
  res.render("user_login");
})

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect('/urls')
});

app.get("/register", (req, res) => {
  res.render("user_registration")
});

app.post("/register", (req, res) => {
  let id = generateRandomString();

  let email = req.body["email"];
  let password = req.body["password"];

  if(isFieldBlank(email, password)){
    res.status(400).send("Email and/or password field is empty");
    return;
  }
  if(doesEmailExist(email, usersDatabase)){
    res.status(400).send("email already registered");
    return;
  }

  res.cookie("userID", id);
  usersDatabase[id] = {id: id,
                    email: req.body["email"],
                    password: req.body["password"]
                    };

  res.redirect("/")
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});