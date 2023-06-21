import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { GoogleProvider } from '../providers/Google'
import { JWT } from './JWT'
import qs from 'qs'
import { joinUrl } from './utils'

export class Google {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.google) return

    if (conf.googleRedirect === '')
      conf.googleRedirect =
        joinUrl(
          swarm.getOption('baseUrl'),
          conf.prefix,
          'social/google/callback'
        ) ?? ''
    if (conf.googleRedirect === '')
      throw new Error('Google redirect URL must be configured')

    swarm.controllers.addMethod(conf.controllerName, Google.init(swarm, conf), {
      method: 'GET',
      route: '/social/google',
      title: 'Logs in with Google',
      query: [
        {
          name: 'redirect',
          description: 'URL where redirect the user after a successful login',
          schema: { type: 'string', format: 'uri' }
        }
      ]
    })

    swarm.controllers.addMethod(
      conf.controllerName,
      Google.callback(swarm, conf),
      {
        method: 'GET',
        route: '/social/google/callback',
        title: 'Logs in with Google (callback)',
        query: [
          {
            name: 'code',
            description: 'Auth code supplied by Google',
            schema: { type: 'string' }
          },
          {
            name: 'state',
            description: 'Auth request state in JSON format',
            schema: { type: 'string' }
          }
        ]
      }
    )
  }

  static init (_: any, conf: AuthPluginOptions) {
    return async function googleInit (request: any, reply: any) {
      const driver = new GoogleProvider()
      const url = await driver.getRedirectUri(conf, request.query.redirect)

      reply.redirect(302, url)
    }
  }

  static buildRedirectUrl (conf: AuthPluginOptions, query: any = {}) {
    return `${conf.prefix}/login?${qs.stringify(query)}`
  }

  static callback (_: any, conf: AuthPluginOptions) {
    return async function googleCallback (request: any, reply: any) {
      const driver = new GoogleProvider()
      const ret = await driver.callback(conf, request.query)

      let existingUser = await conf.model.findOne({
        swarmGoogleId: ret.id
      })

      if (existingUser) {
        reply.redirect(
          302,
          Google.buildRedirectUrl(conf, {
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
        existingUser.swarmGoogleId = ret.id
        existingUser.swarmValidated = true
        await existingUser.save()
        reply.redirect(
          302,
          Google.buildRedirectUrl(conf, {
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
        swarmGoogleId: ret.id,
        swarmValidated: true
      })

      reply.redirect(
        302,
        Google.buildRedirectUrl(conf, {
          redirect: ret.redirect,
          token: JWT.generate(conf, existingUser)
        })
      )
    }
  }
}
