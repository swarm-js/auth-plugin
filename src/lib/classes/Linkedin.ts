import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { LinkedinProvider } from '../providers/Linkedin'
import { JWT } from './JWT'
import qs from 'qs'
import { joinUrl } from './utils'

export class Linkedin {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.linkedin) return

    if (conf.linkedinRedirect === '')
      conf.linkedinRedirect =
        joinUrl(
          swarm.getOption('baseUrl'),
          conf.prefix,
          'social/linkedin/callback'
        ) ?? ''
    if (conf.linkedinRedirect === '')
      throw new Error('Linkedin redirect URL must be configured')

    swarm.controllers.addMethod(
      conf.controllerName,
      Linkedin.init(swarm, conf),
      {
        method: 'GET',
        route: '/social/linkedin',
        title: 'Logs in with Linkedin',
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
      Linkedin.callback(swarm, conf),
      {
        method: 'GET',
        route: '/social/linkedin/callback',
        title: 'Logs in with Linkedin (callback)',
        query: [
          {
            name: 'code',
            description: 'Auth code supplied by Linkedin',
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
    return async function linkedinInit (request: any, reply: any) {
      const driver = new LinkedinProvider()
      const url = await driver.getRedirectUri(conf, request.query.redirect)

      reply.redirect(302, url)
    }
  }

  static buildRedirectUrl (conf: AuthPluginOptions, query: any = {}) {
    return `${conf.prefix}/login?${qs.stringify(query)}`
  }

  static callback (_: any, conf: AuthPluginOptions) {
    return async function linkedinCallback (request: any, reply: any) {
      const driver = new LinkedinProvider()
      const ret = await driver.callback(conf, request.query)

      let existingUser = await conf.model.findOne({
        swarmLinkedinId: ret.id
      })

      if (existingUser) {
        await conf.onLogin(existingUser)
        reply.redirect(
          302,
          Linkedin.buildRedirectUrl(conf, {
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
        existingUser.swarmLinkedinId = ret.id
        existingUser.swarmValidated = true
        await existingUser.save()
        await conf.onLogin(existingUser)
        reply.redirect(
          302,
          Linkedin.buildRedirectUrl(conf, {
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
        swarmLinkedinId: ret.id,
        swarmValidated: true
      })

      await conf.onLogin(existingUser)
      reply.redirect(
        302,
        Linkedin.buildRedirectUrl(conf, {
          redirect: ret.redirect,
          token: JWT.generate(conf, existingUser)
        })
      )
    }
  }
}
