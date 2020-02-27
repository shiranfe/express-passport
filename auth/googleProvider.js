const sa = require('serverless-authentication');
const Profile = sa.Profile;
const Provider = sa.Provider;

function mapProfile(response) {
  const overwrites = {
    name: response.displayName,
    email: response.emails ? response.emails[0].value : null,
    picture: response.image ? response.image.url : null,
    provider: 'google'
  }

  return new Profile(Object.assign(response, overwrites))
}

class GoogleProvider extends Provider {
  signinHandler({
    scope = 'profile email',
    state,
    access_type = 'online',
    prompt
  }) {
    const variableOptions = {
      scope,
      state,
      access_type
    }
    if (prompt) {
      Object.assign(variableOptions, {
        prompt
      })
    }
    const options = Object.assign(variableOptions, {
      signin_uri: 'https://accounts.google.com/o/oauth2/v2/auth',
      response_type: 'code'
    })

    return super.signin(options)
  }

  callbackHandler(event) {
    const options = {
      authorization_uri: 'https://www.googleapis.com/oauth2/v4/token',
      profile_uri: 'https://www.googleapis.com/plus/v1/people/me',
      profileMap: mapProfile,
      authorizationMethod: 'POST'
    }

    return super.callback(event, options, {
      authorization: {
        grant_type: 'authorization_code'
      }
    })
  }
}

const signinHandler = (config, options) =>
  new GoogleProvider(config).signinHandler(options)

const callbackHandler = (event, config) =>
  new GoogleProvider(config).callbackHandler(event)

exports.signinHandler = signinHandler
exports.callbackHandler = callbackHandler
