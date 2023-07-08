import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { FacebookProvider } from '../providers/Facebook'
import { JWT } from './JWT'
import qs from 'qs'
import { joinUrl } from './utils'

export class Facebook {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.facebook) return

    if (conf.facebookRedirect === '')
      conf.facebookRedirect =
        joinUrl(
          swarm.getOption('baseUrl'),
          conf.prefix,
          'social/facebook/callback'
        ) ?? ''
    if (conf.facebookRedirect === '')
      throw new Error('Facebook redirect URL must be configured')

    swarm.controllers.addMethod(
      conf.controllerName,
      Facebook.init(swarm, conf),
      {
        method: 'GET',
        route: '/social/facebook',
        title: 'Logs in with Facebook',
        query: [
          {
            name: 'redirect',
            description: 'URL where redirect the user after a successful login',
            schema: { type: 'string', format: 'uri' }
          }
        ],
        returns: [
          {
            code: 302,
            description: 'The user is redirected',
            mimeType: 'application/json'
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Facebook.callback(swarm, conf),
      {
        method: 'GET',
        route: '/social/facebook/callback',
        title: 'Logs in with Facebook (callback)',
        query: [
          {
            name: 'code',
            description: 'Auth code supplied by Facebook',
            schema: { type: 'string' }
          },
          {
            name: 'state',
            description: 'Auth request state in JSON format',
            schema: { type: 'string' }
          }
        ],
        returns: [
          {
            code: 302,
            description: 'The user is redirected',
            mimeType: 'application/json'
          }
        ]
      }
    )
  }

  static init (_: any, conf: AuthPluginOptions) {
    return async function facebookInit (request: any, reply: any) {
      const driver = new FacebookProvider()
      const url = await driver.getRedirectUri(conf, request.query.redirect)

      reply.redirect(302, url)
    }
  }

  static buildRedirectUrl (conf: AuthPluginOptions, query: any = {}) {
    return `${conf.prefix}/login?${qs.stringify(query)}`
  }

  static callback (_: any, conf: AuthPluginOptions) {
    return async function facebookCallback (request: any, reply: any) {
      const driver = new FacebookProvider()
      const ret = await driver.callback(conf, request.query)

      let existingUser = await conf.model.findOne({
        swarmFacebookId: ret.id
      })

      if (existingUser) {
        await conf.onLogin(existingUser)
        reply.redirect(
          302,
          Facebook.buildRedirectUrl(conf, {
            redirect: ret.redirect,
            token: JWT.generate(conf, existingUser)
          })
        )
        return
      }

      existingUser = await conf.model
        .findOne({ [conf.emailField]: ret.email })
        .exec()
      if (existingUser) {
        existingUser.swarmFacebookId = ret.id
        existingUser.swarmValidated = true
        await existingUser.save()
        await conf.onLogin(existingUser)
        reply.redirect(
          302,
          Facebook.buildRedirectUrl(conf, {
            redirect: ret.redirect,
            token: JWT.generate(conf, existingUser)
          })
        )
        return
      }

      if (!conf.register) throw new Error('Cannot register')

      existingUser = await conf.model.create({
        [conf.emailField]: ret.email,
        [conf.firstnameField]: ret.firstname,
        [conf.lastnameField]: ret.lastname,
        [conf.avatarField]: ret.avatar,
        swarmFacebookId: ret.id,
        swarmValidated: true
      })

      await conf.onLogin(existingUser)
      reply.redirect(
        302,
        Facebook.buildRedirectUrl(conf, {
          redirect: ret.redirect,
          token: JWT.generate(conf, existingUser)
        })
      )
    }
  }
}
