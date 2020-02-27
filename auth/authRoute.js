const express = require('express');
const router = express.Router();
var passport = require('passport');
const querystring = require('querystring');

require('./passportStrategies')(passport);

let redirectSocialUser = function (req, res, next) {
  user = req.user;
  console.log(user);
  if (user.error) {
    console.log(user);
    return res.status(401).send(user).end();
  }

  const query = querystring.stringify(user);

  return res.redirect(process.env.DOMAIN + '?' + query);
}

const callbackOps = {
  //   successRedirect: '/register/info',
  failureRedirect: '/login',
  assignProperty: 'user',
  session: false
};

/** go to GoogleStrategy after authenticated, then to redirectSocialUser
 * https://console.developers.google.com/apis/credentials?project=kicker-219111&supportedpurview=project
 */
router.get('/google/callback', passport.authenticate('google', callbackOps), redirectSocialUser);


router.get('/google', passport.authenticate('google', {
  scope: 'profile email',
  session: false
}));

/** go to FacebookStrategy after authanticated, then to redirectSocialUser*/
router.get('/facebook/callback', passport.authenticate('facebook', callbackOps), redirectSocialUser);

/** get profile image from Graph API Explorer,
 * https://developers.facebook.com/tools/explorer/
 * https://developers.facebook.com/tools/explorer/?method=GET&path=10157272770494095%2Fpicture%3Fheight%3D118%26width%3D118&version=v3.2&classic=0
 * */
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email', 'public_profile'],
  session: false
}));


module.exports = router;