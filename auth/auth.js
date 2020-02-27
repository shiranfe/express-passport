// var jwt = require('express-jwt');
// var secret = require('./secret');
// var config = require('./authConfig');
var passport = require('passport');

/** use this to verify each http call (in baseController)*/
// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
var jwtCheck = passport.authenticate('jwt', {
  session: false
});

/*jwt({
  secret: secret,
  getToken: function fromHeaderOrQuerystring(req) {
    let auth = req.headers['authorization'];

    if (auth && auth.split(' ')[0] === 'Bearer') {
      var token = auth.split(' ')[1];

      return token;
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  },
  audience: config.AUTH0_AUDIENCE,
  issuer: `https://${config.CLIENT_DOMAIN}/`,
  algorithm: 'RS256'
});*/

module.exports = jwtCheck;
