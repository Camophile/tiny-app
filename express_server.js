const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(function(req, res, next){ //defines userID 'globally'
                                  //accessible to other routes
  res.locals.user = req.cookies["userID"];
  res.locals.email = req.cookies["email"];
  res.locals.password = req.cookies["password"];
  next();
});

var usersDatabase = {}; //set as obj of arrs?

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

app.get('/', (req, res) => {
  res.end("<html<body>Hello <b>Mildred!</b></body></html>\n");
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
  res.cookie("userID", req.body["userID"]);
  res.redirect('/urls');
});

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

  console.log(usersDatabase);
  if(isFieldBlank(email, password)){
    res.status(400).send("Email and/or password field is empty");
    return;
  }
  if(doesEmailExist(email, usersDatabase)){
    res.status(400).send("email already registered");
    return;
  }
  console.log(doesEmailExist(email, usersDatabase));
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