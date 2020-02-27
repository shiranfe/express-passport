const User = require('../user/user'),
  generator = require('generate-password'),
  jwt = require('jsonwebtoken'),
  secret = require('./secret'),
  ErrorHelper = require('../../errors/errorHelper'),
  imageHalper = require('../core/imageHelper'),
  path = require('path'),
  hbs = require('nodemailer-express-handlebars'),
  nodemailer = require('nodemailer');
//Node.js Function to save image from External URL.
// const fs = require('fs');
// const https = require('https');

function signUserIn(user, needEdit = false) {
  var token = jwt.sign(user.toJSON(), secret); // { expiresIn: '1y'  }
  // console.log(jwt.decode(token));

  return {
    auth_token: 'JWT ' + token,
    expires_in: 31557600000, //1 year
    fullName: user.name || 'new user',
    email: user.email,
    picture: user.myPic,
    needEdit: needEdit,
    inHomebase: user.inHomebase
  };
}


function socialSuccess(user, needEdit) {
  return signUserIn(user, needEdit);
}


function saveImageToDisk(url, user) {

  const image = `/media/avatar/${user.id}.jpg`;
  const srcUrl = url.replace("s50", "s118").replace("?sz=50", "?sz=118"); // for google

  imageHalper.saveImageFromUrl(srcUrl, image, function () {
    user.picture = `${image}`;

    user.save();
  });

  // console.log('request :', request);
}

async function createFromSocial(data) {
  if (!data.name) {
    console.log('no data name', data);
    data.name = data.email.split('@')[0]
  }
  let newUser = new User({
    name: data.name,
    emails: [data.email],
    email: data.email,
    username: data.email,
    picture: data.profile_picture,
    email_verified: true,
    password: generator.generate({
      length: 10,
      numbers: true
    }),
    social: [data.meta]

  });

  const ans = await User.create(newUser);

  if (data.profile_picture) {
    saveImageToDisk(data.profile_picture, newUser);
    await newUser.save();
  }



  return ans;
}




class AuthService {


  async login(data) {

    const user = await this.getUser(data.email);

    if (!user) {
      // console.log('user doesnt exist', data.email);
      throw ErrorHelper.unauthorized('User.Error.UserDoesntExist');
    }

    const isMatch = user.comparePassword(data.password);

    if (!isMatch) {
      // console.log('wrong password', data.password);
      throw ErrorHelper.unauthorized('User.Error.WrongLogin');
    }

    // if user is found and password is right create a token
    return signUserIn(user);

  }

  async getUser(email) {
    return await User.findOne({
      $or: [{
          username: email
        },
        {
          emails: email
        }
      ]

    });
  }

  async register(data) {

    if (!data.email || !data.password) {
      throw ErrorHelper.badRequest('User.Error.MissingFields');
    }

    const exist = await this.getUser(data.email);

    if (exist) {
      throw ErrorHelper.alreadyExist('User.Error.UserAlreadyExist');
    }

    const newUser = new User({
      username: data.email,
      password: data.password,
      name: data.email.split('@')[0],
      email: [data.email]
    });

    const user = await User.create(newUser);

    await this.sendRegisterConfirmMail(user);

    return signUserIn(user);

  }





  async registerSocial(data) {
    try {
      let user = await this.getUser(data.email);


      if (!user) {
        user = await createFromSocial(data);
        await this.sendRegisterConfirmMail(user);

        return socialSuccess(user, true);
      }

      /** user exists, but was not logged with social */
      if (!user.social) {
        user.social = [];
      }

      /** user has logged with this social */
      if (user.social.find(x => x.provider == data.meta.provider)) {
        // saveImageToDisk(data.profile_picture, user);
        return socialSuccess(user);
      }

      /** complete data if missing */
      if (!user.name) {
        user.name = data.name;
      }

      //
      if (!user.picture && data.profile_picture) {
        saveImageToDisk(data.profile_picture, user);
      }
      /** add provider to exiting user */
      user.social.push(data.meta);

      await user.save();

      return socialSuccess(user, true);

    } catch (error) {
      throw error;
    }



    // } catch (e) {
    //   return done(null, {
    //     error: true,
    //     message: e.message,
    //     user: user

    //   });
    // }


  }


  async sendRegisterConfirmMail(user) {

    if (!user) {
      return;
    }

    const token = user.password;
    // generator.generate({
    //   length: 40,
    //   numbers: true
    // });

    const emailData = {
      to: user.email,
      from: process.env.MAILER_EMAIL_ID,
      template: 'register-confirm',
      subject: 'ברוך הבא ל Kix',
      context: {
        url: `${process.env.DOMAIN}/registerConfirm?token=${token}`,
      }
    };

    await this.sendEmail(emailData);

    return {
      code: token
    };

  }

  async sendRecoveryMail(data) {

    const user = await this.getUser(data.email);

    if (!user) {
      throw ErrorHelper.unauthorized('User.Form.ForgotPassword.NotExist');
    }

    const token = user.password;
    // generator.generate({
    //   length: 40,
    //   numbers: true
    // });

    const emailData = {
      to: data.email,
      from: process.env.MAILER_EMAIL_ID,
      template: 'forgot-password-email',
      subject: 'שחזור סיסמא ל Kix',
      context: {
        url: `${process.env.DOMAIN}/restPassword?token=${token}`,
        name: user.name
      }
    };

    await this.sendEmail(emailData);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>


    return {
      code: token
    };

  }

  async sendEmail(emailData) {
    const smtpTransport = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
      auth: {
        user: process.env.MAILER_EMAIL_ID,
        pass: process.env.MAILER_PASSWORD
      }
    });
    const handlebarsOptions = {
      viewEngine: {
        extName: '.html',
        partialsDir: 'templates/',
        layoutsDir: 'templates/',
        defaultLayout: '_layout.html',
      },
      viewPath: 'templates/',
      extName: '.html'
    };
    smtpTransport.use('compile', hbs(handlebarsOptions));
    let info = await smtpTransport.sendMail(emailData);
    console.log("Message sent: %s", emailData.to);
  }

  async restPassword(data) {

    const user = await User.findOne({
      password: data.token
    });

    if (!user) {
      throw ErrorHelper.unauthorized('User.Form.ForgotPassword.NotExist');
    }

    user.password = data.newPassword;
    user.save();

    return {

    };

  }

  async registerConfirm(data) {

    const user = await User.findOne({
      password: data.token
    });

    if (!user) {
      throw ErrorHelper.unauthorized('User.Form.ForgotPassword.NotExist');
    }

    user.passwordConfirmed = new Date();
    user.save();

    return {

    };

  }
}



module.exports = new AuthService();
