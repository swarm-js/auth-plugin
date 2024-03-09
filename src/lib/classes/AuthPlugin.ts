import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Ethereum } from './Ethereum'
import { Facebook } from './Facebook'
import { fastifyMiddleware } from './FastifyMiddleware'
import { Fido2 } from './Fido2'
import { Google } from './Google'
import { GoogleAuthenticator } from './GoogleAuthenticator'
import { Password } from './Password'
import { Session } from './Session'
import { UI } from './UI'
import { getHost, getHostname, getOrigin } from './utils'
import jwt from 'jsonwebtoken'

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
      logoBackgroundColor: 'transparent',
      rpName: instance.getOption('title') ?? 'AuthPlugin',
      rpId: null,
      origin: null,
      password: true,
      requireOldPasswordForUpdate: true,
      invite: false,
      fido2: false,
      facebook: false,
      google: false,
      ethereum: false,
      register: true,
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
      sessionDuration: 3600,
      userAccess: () => [],
      onLogin: async () => {},
      ...options
    }

    conf.allowedDomains.push(getHost(instance.getOption('baseUrl')) ?? '')
    if (!conf.rpId) conf.rpId = getHostname(instance.getOption('baseUrl'))
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
        return [
          'swarm:loggedIn',
          `user:${req.user.id}`,
          ...(req.user.swarmUserAccess ?? []),
          ...conf.userAccess(req)
        ]

      return null
    })

    // Handle sockets
    if (swarm.onSocketConnection) {
      swarm.onSocketConnection((socket: any, eventBus: any) => {
        try {
          const decoded: any = jwt.verify(
            socket.handshake.auth.token,
            conf.jwtKey
          )
          socket.join(`user:${decoded.id}`)
          socket.data.userId = decoded.id
          eventBus.emit('swarm:loggedIn', decoded.id)
        } catch {
          socket.disconnect(true)
        }
      })
    }

    // Handle decorators
    swarm.appendOption('injectors', {
      name: 'auth-plugin:user',
      getValue (req: any) {
        return req.user
      }
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
    Session.setup(swarm, conf)

    swarm.i18n.addTranslations(
      {
        en: require('../locales/en.json'),
        fr: require('../locales/fr.json')
      },
      'auth-plugin'
    )
  }
}
