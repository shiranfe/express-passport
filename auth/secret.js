// var jwks = require('jwks-rsa');
// var config = require('./authConfig');

// Dynamically provide a signing key
// based on the kid in the header and
// the signing keys provided by the JWKS endpoint.
// module.exports = jwks.expressJwtSecret({
//   cache: true,
//   rateLimit: true,
//   jwksRequestsPerMinute: 5,
//   jwksUri: `https://${config.CLIENT_DOMAIN}/.well-known/jwks.json`
// });
module.exports = '$2a$10$6yqZj1CjkVT/aKwFi6h4cuZnyGlsdyXwfPTVnbv3a/RpHjY7ETUhm';
