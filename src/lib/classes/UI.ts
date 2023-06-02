import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import path from 'path'
import fs from 'fs/promises'

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
        title: 'Displays an UI to confirm an email',
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
    return async function () {
      return await UI.getIndexFile(
        'Confirm your email address',
        `confirm`,
        conf
      )
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
            ethereum: conf.ethereum
          })};
          window.AuthPluginPage = '${page}';
        </script>`
    )
  }
}
