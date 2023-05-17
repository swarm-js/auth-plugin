import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export class UI {
  static setup (swarm: any, conf: AuthPluginOptions) {
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
      UI.getRegisterUI(swarm, conf),
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

  static getLoginUI (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }

  static getRegisterUI (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
}
