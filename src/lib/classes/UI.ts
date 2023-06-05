import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import path from 'path'
import fs from 'fs/promises'
import { Unauthorized } from 'http-errors'

export class UI {
  static setup (swarm: any, conf: AuthPluginOptions) {
    swarm.fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, '../../../front/dist'),
      prefix: '/auth-plugin-static'
    })

    swarm.controllers.addMethod(
      conf.controllerName,
      UI.getLoginUI(swarm, conf),
      {
        method: 'GET',
        route: '/login',
        title: 'Displays a login UI with the various configured methods',
        query: [
          {
            name: 'redirect',
            schema: { type: 'string', format: 'uri' },
            description: 'URL where redirect the user after a successful login'
          },
          {
            name: 'mode',
            schema: { type: 'string', enum: ['iframe', 'popup', 'redirect'] },
            description: 'Login mode : iframe, popup or redirect'
          }
        ],
        returns: [
          {
            code: 200,
            description: 'HTML page',
            mimeType: 'text/html',
            schema: {
              type: 'string'
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      UI.getRegisterUI(swarm, conf),
      {
        method: 'GET',
        route: '/register',
        title: 'Displays a register UI with the various configured methods',
        query: [
          {
            name: 'redirect',
            schema: { type: 'string', format: 'uri' },
            description: 'URL where redirect the user after a successful login'
          },
          {
            name: 'mode',
            schema: { type: 'string', enum: ['iframe', 'popup', 'redirect'] },
            description: 'Login mode : iframe, popup or redirect'
          }
        ],
        returns: [
          {
            code: 200,
            description: 'HTML page',
            mimeType: 'text/html',
            schema: {
              type: 'string'
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      UI.getConfirmEmailUI(swarm, conf),
      {
        method: 'GET',
        route: '/confirm-email',
        title: 'Email confirmation link',
        query: [
          {
            name: 'redirect',
            schema: { type: 'string', format: 'uri' },
            description: 'Redirection URI'
          },
          {
            name: 'code',
            schema: { type: 'string', format: 'uuid' },
            description: 'Validation code'
          }
        ],
        returns: [
          {
            code: 200,
            description: 'HTML page',
            mimeType: 'text/html',
            schema: {
              type: 'string'
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      UI.getForgotUI(swarm, conf),
      {
        method: 'GET',
        route: '/forgot-password',
        title: 'Displays an UI to retrieve an email',
        returns: [
          {
            code: 200,
            description: 'HTML page',
            mimeType: 'text/html',
            schema: {
              type: 'string'
            }
          }
        ]
      }
    )
  }

  static getLoginUI (_: any, conf: AuthPluginOptions) {
    return async function () {
      return await UI.getIndexFile('Login', `login`, conf)
    }
  }

  static getRegisterUI (_: any, conf: AuthPluginOptions) {
    return async function () {
      return await UI.getIndexFile('Register', `register`, conf)
    }
  }

  static getConfirmEmailUI (_: any, conf: AuthPluginOptions) {
    return async function (request: any) {
      try {
        const domain = new URL(request.query.redirect).host
        if (
          (conf.allowedDomains ?? []).length &&
          (conf.allowedDomains ?? []).includes(domain) === false
        )
          throw new Error('Domain not allowed')
      } catch {
        return await UI.getIndexFile(
          'Email validation error',
          `emailNotConfirmed`,
          conf
        )
      }

      const user = await conf.model.findOne({
        swarmValidationCode: request.query.code
      })
      if (!user)
        return await UI.getIndexFile(
          'Email validation error',
          `emailNotConfirmed`,
          conf
        )
      user.swarmValidationCode = ''
      user.swarmValidated = true
      await user.save()
      return await UI.getIndexFile(
        'Email address confirmed',
        `emailConfirmed`,
        conf
      )
    }
  }

  static getForgotUI (_: any, conf: AuthPluginOptions) {
    return async function () {
      return await UI.getIndexFile('Retrieve your password', `forgot`, conf)
    }
  }

  static async getIndexFile (
    title: string,
    page: string,
    conf: AuthPluginOptions
  ) {
    const src = (
      await fs.readFile(path.join(__dirname, '../../../front/dist/index.html'))
    ).toString()

    return src.replace(/\[\[TITLE\]\]/g, title).replace(
      /\[\[INIT_CODE\]\]/g,
      `<script type="text/javascript">
          window.AuthPluginConf = ${JSON.stringify({
            logo: conf.logo,
            themeColor: conf.themeColor,
            prefix: conf.prefix,
            rpName: conf.rpName,
            password: conf.password,
            fido2: conf.fido2,
            facebook: conf.facebook,
            google: conf.google,
            googleAuthenticator: conf.googleAuthenticator,
            ethereum: conf.ethereum,
            allowedDomains: conf.allowedDomains
          })};
          window.AuthPluginPage = '${page}';
        </script>`
    )
  }
}
