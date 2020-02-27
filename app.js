const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
var path = require('path');
var passport = require('passport');
require('dotenv').config();

app.use(passport.initialize());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// body-parser extract the entire body portion of an incoming request stream and exposes it on req.body
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);



app.use('/social', require('./auth/authRoute'));

app.get('/about', (req, res) => res.render('about', {
    title: 'about'
}));

app.get('/', (req, res) => res.render('home', {
    title: 'shiran',
    domain: process.env.DOMAIN,
    email: req.query ? req.query.email : null
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404);
    next(req);
});


if (process.env.NODE_ENV == 'development') {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
} else {
    module.exports.handler = require('serverless-http')(app);
}