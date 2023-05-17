import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Apple } from './Apple'
import { Ethereum } from './Ethereum'
import { Facebook } from './Facebook'
import { Fido2 } from './Fido2'
import { Google } from './Google'
import { GoogleAuthenticator } from './GoogleAuthenticator'
import { Microsoft } from './Microsoft'
import { Passkey } from './Passkey'
import { Password } from './Password'
import { UI } from './UI'

let swarm: any
let conf: AuthPluginOptions

export default class AuthPlugin {
  static setup (instance: any, options: Partial<AuthPluginOptions> = {}) {
    swarm = instance

    conf = {
      controllerName: 'AuthPlugin',
      prefix: '/auth',
      jwtKey: 'asupersecretnotsosecret',
      model: null,
      access: null,
      rpName: null,
      rpId: null,
      origin: null,
      password: true,
      fido2: false,
      passkey: false,
      facebook: false,
      google: false,
      microsoft: false,
      apple: false,
      emailField: 'email',
      firstnameField: 'firstname',
      lastnameField: 'lastname',
      avatarField: 'avatar',
      googleAuthenticator: false,
      googleClientId: '',
      googleClientSecret: '',
      googleRedirect: '',
      facebookClientId: '',
      facebookClientSecret: '',
      facebookRedirect: '',
      microsoftClientId: '',
      microsoftClientSecret: '',
      microsoftRedirect: '',
      appleClientId: '',
      appleClientSecret: '',
      appleRedirect: '',
      ...options
    }

    if (conf.model === null) throw new Error('Mongoose model is not defined')

    if (conf.passkey && (!conf.rpId || !conf.rpName || !conf.origin))
      throw new Error(
        'When using passkeys, rpName, rpId and origin fields are required'
      )

    if (conf.fido2 && (!conf.rpId || !conf.rpName || !conf.origin))
      throw new Error(
        'When using FIDO2, rpName, rpId and origin fields are required'
      )

    instance.controllers.addController(conf.controllerName, {
      title: 'Auth',
      description: 'Handles auth with various methods',
      prefix: conf.prefix
    })

    UI.setup(swarm, conf)
    Password.setup(swarm, conf)
    Passkey.setup(swarm, conf)
    GoogleAuthenticator.setup(swarm, conf)
    Fido2.setup(swarm, conf)
    Facebook.setup(swarm, conf)
    Google.setup(swarm, conf)
    Microsoft.setup(swarm, conf)
    Apple.setup(swarm, conf)
    Ethereum.setup(swarm, conf)
  }
}