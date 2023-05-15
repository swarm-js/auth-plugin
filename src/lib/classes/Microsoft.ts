import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { MicrosoftProvider } from '../providers/Microsoft'
import { JWT } from './JWT'
import qs from 'qs'

export class Microsoft {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.microsoft) return

    swarm.controllers.addMethod(
      conf.controllerName,
      Microsoft.init(swarm, conf),
      {
        method: 'GET',
        route: '/social/microsoft',
        title: 'Logs in with Microsoft',
        query: [
          {
            name: 'redirect',
            description: 'URL where redirect the user after a successful login',
            schema: { type: 'string', format: 'uri' }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Microsoft.callback(swarm, conf),
      {
        method: 'GET',
        route: '/social/microsoft/callback',
        title: 'Logs in with Microsoft (callback)',
        query: [
          {
            name: 'code',
            description: 'Auth code supplied by Microsoft',
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

  static init (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any, reply: any) {
      const driver = new MicrosoftProvider()
      const url = await driver.getRedirectUri(conf, request.query.redirect)

      reply.redirect(302, url)
    }
  }

  static buildRedirectUrl (conf: AuthPluginOptions, query: any = {}) {
    return `${conf.prefix}/login?${qs.stringify(query)}`
  }

  static callback (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any, reply: any) {
      const driver = new MicrosoftProvider()
      const ret = await driver.callback(conf, request.query)

      let existingUser = await conf.model.findOne({
        swarmMicrosoftId: ret.id
      })

      if (existingUser) {
        reply.redirect(
          302,
          Microsoft.buildRedirectUrl(conf, {
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
        existingUser.swarmMicrosoftId = ret.id
        await existingUser.save()
        reply.redirect(
          302,
          Microsoft.buildRedirectUrl(conf, {
            redirect: ret.redirect,
            token: JWT.generate(conf, existingUser)
          })
        )
        return
      }

      existingUser = await conf.model.create({
        [conf.emailField]: ret.email,
        [conf.firstnameField]: ret.firstname,
        [conf.lastnameField]: ret.lastname,
        [conf.avatarField]: ret.avatar,
        swarmMicrosoftId: ret.id
      })

      reply.redirect(
        302,
        Microsoft.buildRedirectUrl(conf, {
          redirect: ret.redirect,
          token: JWT.generate(conf, existingUser)
        })
      )
    }
  }
}
