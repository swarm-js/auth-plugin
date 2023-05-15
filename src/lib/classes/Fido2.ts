import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export class Fido2 {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.fido2) return

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Init(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/init',
        title: 'Initialize FIDO2 configuration',
        accepts: {
          type: 'object',
          properties: {
            deviceName: {
              type: 'string'
            }
          }
        }
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Register(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/register',
        title: 'Register FIDO2 credentials',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        accepts: {
          type: 'object',
          properties: {
            deviceName: {
              type: 'string'
            }
          }
        }
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2AuthOptions(swarm, conf),
      {
        method: 'GET',
        route: '/fido2/:id/auth-options',
        title: 'Get FIDO2 auth options',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Authenticate(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/authenticate',
        title: 'Authenticate logged in user with FIDO2 credentials',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Login(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/login',
        title: 'Logs in a user with credentials',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ]
      }
    )
  }

  static fido2Init (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
  static fido2Register (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
  static fido2AuthOptions (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
  static fido2Authenticate (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
  static fido2Login (swarm: any, conf: AuthPluginOptions) {
    return async function (request: any) {}
  }
}
