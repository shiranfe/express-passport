var JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,


  secret = require('./secret');

module.exports = function (passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = secret;


  passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
    done(null, jwt_payload);
  }));


  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_CLIENTID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: process.env.DOMAIN + '/social/facebook/callback',
      profileFields: ['id', 'emails', 'picture.width(100).height(100)']
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let data = profile._json;
        // console.log(data);

        const userCredentials = {
          provider: 'facebook',
          name: data.name,
          email: data.email,
          profile_picture: profile.photos ? profile.photos[0].value : '',
          meta: {
            provider: 'facebook',
            id: profile.id,
            token: accessToken,
          }
        };

        return done(null, userCredentials);

      } catch (e) {
        return done(e);
      }
    }

  ));


  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.DOMAIN + '/social/google/callback'
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let data = profile._json;
        // console.log(data);

        // const userCredentials = {
        //   provider: 'google',
        //   name: data.displayName,
        //   email: data.emails,
        //   profile_picture: data.image.url,
        //   meta: {
        //     provider: 'google',
        //     id: profile.id,
        //     token: accessToken,
        //   }
        // };

        return done(null, data);

      } catch (e) {
        return done(e);
      }

    }
  ));


};