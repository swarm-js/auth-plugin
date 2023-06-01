import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { authenticator } from 'otplib'
import { BadRequest, Unauthorized } from 'http-errors'
import qrcode from 'qrcode'

export class GoogleAuthenticator {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.googleAuthenticator) return

    swarm.controllers.addMethod(
      conf.controllerName,
      GoogleAuthenticator.add(swarm, conf),
      {
        method: 'POST',
        route: '/authenticator',
        title:
          'Get the QRCode to attach logged in account to Google Authenticator',
        access: ['swarm:loggedIn'],
        returns: [
          {
            code: 200,
            description: 'QRCode image dataURI',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                qrcode: 'string'
              }
            }
          },
          {
            code: 400,
            description: 'The logged in account already has an authenticator',
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
      GoogleAuthenticator.validate(),
      {
        method: 'POST',
        route: '/authenticator/validate',
        title:
          'Validate the authenticator and permanently attaches it to the logged in user',
        access: ['swarm:loggedIn'],
        accepts: {
          type: 'object',
          properties: {
            code: { type: 'number' }
          }
        },
        returns: [
          {
            code: 200,
            description: 'The authenticator is correctly attached',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 400,
            description:
              'There is no authenticator on this account, or already validated',
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
            code: 403,
            description: 'The submitted code is invalid',
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
      GoogleAuthenticator.verify(),
      {
        method: 'POST',
        route: '/authenticator/verify',
        title: 'Verifies a TOTP against saved authenticator',
        access: ['swarm:totpNeeded'],
        accepts: {
          type: 'object',
          properties: {
            code: { type: 'number' }
          }
        },
        returns: [
          {
            code: 200,
            description: 'The code is valid',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 400,
            description:
              'There is no authenticator on this account, or not validated',
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
            code: 403,
            description: 'The submitted code is invalid',
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
      GoogleAuthenticator.delete(),
      {
        method: 'DELETE',
        route: '/authenticator',
        title: 'Deletes the attached authenticator',
        access: ['swarm:loggedIn'],
        returns: [
          {
            code: 204,
            description: 'The authenticator has been deleted',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 400,
            description:
              'The logged in account does not have any authenticator attached',
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

  static add (_: any, conf: AuthPluginOptions) {
    return async function (req: any, res: any) {
      if (
        !req.user.swarmGoogleAuthenticatorPending &&
        req.user.swarmGoogleAuthenticatorSecret
      )
        throw new BadRequest()

      req.user.swarmGoogleAuthenticatorPending = true
      req.user.swarmGoogleAuthenticatorSecret = authenticator.generateSecret()
      await req.user.save()

      const otpauth = authenticator.keyuri(
        req.user[conf.emailField],
        conf.googleAuthenticatorService,
        req.user.swarmGoogleAuthenticatorSecret
      )

      qrcode.toDataURL(otpauth, (err, imageUrl) => {
        if (err) {
          throw err
        }
        res.send({
          qrcode: imageUrl
        })
      })
    }
  }

  static validate () {
    return async function (req: any) {
      if (
        !req.user.swarmGoogleAuthenticatorPending ||
        !req.user.swarmGoogleAuthenticatorSecret
      )
        throw new BadRequest()

      try {
        const isValid = authenticator.check(
          req.body.code,
          req.user.swarmGoogleAuthenticatorSecret
        )
        if (!isValid) throw new Unauthorized()
      } catch {
        throw new Unauthorized()
      }

      req.user.swarmGoogleAuthenticatorPending = false
      await req.user.save()

      return {
        status: true
      }
    }
  }

  static verify () {
    return async function (req: any) {
      if (
        req.user.swarmGoogleAuthenticatorPending ||
        !req.user.swarmGoogleAuthenticatorSecret
      )
        throw new BadRequest()

      try {
        const isValid = authenticator.check(
          req.body.code,
          req.user.swarmGoogleAuthenticatorSecret
        )
        if (!isValid) throw new Unauthorized()
      } catch {
        throw new Unauthorized()
      }

      return {
        status: true
      }
    }
  }

  static delete () {
    return async function (req: any) {
      if (!req.user.swarmGoogleAuthenticatorSecret) throw new BadRequest()

      req.user.swarmGoogleAuthenticatorSecret = ''
      req.user.swarmGoogleAuthenticatorPending = false
      await req.user.save()

      return {
        status: true
      }
    }
  }
}
