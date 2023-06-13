import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Ethereum } from './Ethereum'
import { Facebook } from './Facebook'
import { fastifyMiddleware } from './FastifyMiddleware'
import { Fido2 } from './Fido2'
import { Google } from './Google'
import { GoogleAuthenticator } from './GoogleAuthenticator'
import { Password } from './Password'
import { UI } from './UI'
import { getHost, getOrigin } from './utils'

let swarm: any
let conf: AuthPluginOptions

export class AuthPlugin {
  static setup (instance: any, options: Partial<AuthPluginOptions> = {}) {
    swarm = instance

    conf = {
      controllerName: 'AuthPlugin',
      prefix: '/auth',
      jwtKey: 'asupersecretnotsosecret',
      model: null,
      validationRequired: false,
      logo: null,
      themeColor: '#8500d2',
      rpName: null,
      rpId: null,
      origin: null,
      password: true,
      fido2: false,
      facebook: false,
      google: false,
      ethereum: false,
      emailField: 'email',
      firstnameField: 'firstname',
      lastnameField: 'lastname',
      avatarField: 'avatar',
      googleAuthenticator: false,
      googleAuthenticatorService: instance.getOption('title') ?? 'AuthPlugin',
      googleClientId: '',
      googleClientSecret: '',
      googleRedirect: '',
      facebookClientId: '',
      facebookClientSecret: '',
      facebookRedirect: '',
      allowedDomains: [],
      ...options
    }

    if (!conf.rpId) conf.rpId = getHost(instance.getOption('baseUrl'))
    if (!conf.origin) conf.origin = getOrigin(instance.getOption('baseUrl'))

    if (conf.model === null) throw new Error('Mongoose model is not defined')

    // Add decorators and middlewares to fastify
    swarm.fastify.decorateRequest('user', null)
    swarm.fastify.decorateRequest('userToken', null)
    swarm.fastify.decorateRequest('totpNeeded', false)
    swarm.fastify.decorateRequest('validationRequired', false)
    swarm.fastify.addHook('preHandler', fastifyMiddleware(conf))

    // Set auth documentation to bearer
    swarm.bearerAuth('JWT')

    // Handle user access
    swarm.setOption('getUserAccess', (req: any) => {
      if (req.user && req.validationRequired)
        return ['swarm:validationRequired']
      if (req.user && req.totpNeeded) return ['swarm:totpNeeded']

      if (req.user)
        return ['swarm:loggedIn', ...(req.user.swarmUserAccess ?? [])]

      return null
    })

    if (conf.fido2 && (!conf.rpId || !conf.rpName || !conf.origin))
      throw new Error(
        'When using FIDO2, rpName, rpId and origin fields are required'
      )

    // Register controllers
    instance.controllers.addController(conf.controllerName, {
      title: 'Auth',
      description: 'Handles auth with various methods',
      prefix: conf.prefix,
      root: true
    })

    UI.setup(swarm, conf)
    Password.setup(swarm, conf)
    GoogleAuthenticator.setup(swarm, conf)
    Fido2.setup(swarm, conf)
    Facebook.setup(swarm, conf)
    Google.setup(swarm, conf)
    Ethereum.setup(swarm, conf)
  }
}
