import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export class Password {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.password) return

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.register(swarm, conf),
      {
        method: 'POST',
        route: '/register',
        title: 'Create an account with email / password',
        accepts: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              description: 'Password'
            }
          }
        },
        returns: [
          {
            code: 201,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' }
              }
            }
          },
          {
            code: 400,
            description: 'Password not secure enough',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          },
          {
            code: 409,
            description: 'Email already used',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.login(swarm, conf),
      {
        method: 'POST',
        route: '/login',
        title: 'Log in with email / password',
        accepts: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              description: 'Password'
            }
          }
        },
        returns: [
          {
            code: 200,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' }
              }
            }
          },
          {
            code: 403,
            description: 'Wrong email or password',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          }
        ]
      }
    )
  }
  static register (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
  static login (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
}
