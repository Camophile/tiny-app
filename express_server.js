const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

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

app.get('/', (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"]
  };
  res.end("<html<body>Hello <b>Mildred!</b></body></html>\n", templateVars);
});

app.get('/urls.json', (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"]
  };
  res.json(urlDatabase, templateVars);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userID: req.cookies["userID"]
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"]
  };
  res.render("urls_new", templateVars);
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    userID: req.cookies["userID"]
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
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    userID: req.cookies["userID"]
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
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});