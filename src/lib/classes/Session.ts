import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { JWT } from './JWT'

export class Session {
  static setup (swarm: any, conf: AuthPluginOptions) {
    swarm.controllers.addMethod(
      conf.controllerName,
      Session.renewSession(swarm, conf),
      {
        method: 'POST',
        route: '/renew',
        title: 'Renew token',
        access: ['swarm:loggedIn'],
        returns: [
          {
            code: 200,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                validationRequired: { type: 'boolean' }
              }
            }
          },
          {
            code: 403,
            description: 'Not logged in',
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

  static renewSession (_: any, conf: AuthPluginOptions) {
    return async function renewSession (request: any) {
      let totpNeeded = false
      if (
        conf.googleAuthenticator &&
        !request.user.swarmGoogleAuthenticatorPending &&
        request.user.swarmGoogleAuthenticatorSecret
      )
        totpNeeded = true

      return {
        token: JWT.generate(
          conf,
          request.user,
          totpNeeded,
          !request.user.swarmValidated && conf.validationRequired
        ),
        validationRequired:
          !request.user.swarmValidated && conf.validationRequired
      }
    }
  }
}
