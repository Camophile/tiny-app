const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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
  res.end("<html<body>Hello <b>Mildred!</b></body></html>\n");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  res.render('urls_index', {urls: urlDatabase}
  );
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});



