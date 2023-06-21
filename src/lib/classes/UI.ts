import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import path from 'path'
import fs from 'fs/promises'

export class UI {
  static setup (swarm: any, conf: AuthPluginOptions) {
    swarm.fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, '../../../front/dist'),
      prefix: '/auth-plugin-static',
      decorateReply: false
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
      UI.getMagicLinkUI(swarm, conf),
      {
        method: 'GET',
        route: '/ask-magic-link',
        title: 'Displays an UI to ask for a magic link',
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

    if (conf.invite)
      swarm.controllers.addMethod(
        conf.controllerName,
        UI.getAcceptInvitationUI(swarm, conf),
        {
          method: 'GET',
          route: '/accept-invitation',
          title: 'UI to accept an invitation',
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
  }

  static getLoginUI (_: any, conf: AuthPluginOptions) {
    return async function getLoginUI (_: any, reply: any) {
      reply.header('Content-Type', 'text/html')
      return await UI.getIndexFile('Login', `login`, conf)
    }
  }

  static getRegisterUI (_: any, conf: AuthPluginOptions) {
    return async function getRegisterUI (_: any, reply: any) {
      reply.header('Content-Type', 'text/html')
      return await UI.getIndexFile('Register', `register`, conf)
    }
  }

  static getAcceptInvitationUI (_: any, conf: AuthPluginOptions) {
    return async function getAcceptInvitationUI (_: any, reply: any) {
      reply.header('Content-Type', 'text/html')
      return await UI.getIndexFile(
        'Accept invitation',
        `acceptinvitation`,
        conf
      )
    }
  }

  static getConfirmEmailUI (_: any, conf: AuthPluginOptions) {
    return async function getConfirmEmailUI (request: any, reply: any) {
      try {
        const domain = new URL(request.query.redirect).host
        if (
          (conf.allowedDomains ?? []).length &&
          (conf.allowedDomains ?? []).includes(domain) === false
        )
          throw new Error('Domain not allowed')
      } catch {
        reply.header('Content-Type', 'text/html')
        return await UI.getIndexFile(
          'Email validation error',
          `emailNotConfirmed`,
          conf
        )
      }

      const user = await conf.model.findOne({
        swarmValidationCode: request.query.code
      })
      if (!user) {
        reply.header('Content-Type', 'text/html')
        return await UI.getIndexFile(
          'Email validation error',
          `emailNotConfirmed`,
          conf
        )
      }
      user.swarmValidationCode = ''
      user.swarmValidated = true
      await user.save()
      reply.header('Content-Type', 'text/html')
      return await UI.getIndexFile(
        'Email address confirmed',
        `emailConfirmed`,
        conf
      )
    }
  }

  static getMagicLinkUI (_: any, conf: AuthPluginOptions) {
    return async function getMagicLinkUI (_: any, reply: any) {
      reply.header('Content-Type', 'text/html')
      return await UI.getIndexFile('Ask for a magic link', `magiclink`, conf)
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

    return src
      .replace(/\[\[TITLE\]\]/g, title)
      .replace(
        /\[\[INIT_CODE\]\]/g,
        `<script type="text/javascript">
          window.AuthPluginConf = ${JSON.stringify({
            logo: conf.logo,
            themeColor: conf.themeColor,
            prefix: conf.prefix,
            rpName: conf.rpName,
            password: conf.password,
            register: conf.register,
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
      .replace(/(href|src)="/g, '$1="/auth-plugin-static')
  }
}
