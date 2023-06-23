import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { authenticator } from 'otplib'
import { BadRequest, Forbidden } from 'http-errors'
import qrcode from 'qrcode'
import { JWT } from './JWT'

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
                qrcode: { type: 'string' }
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
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              code: { type: 'string', pattern: '^[0-6]{6}$' }
            }
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
      GoogleAuthenticator.verifyAuthenticator(swarm, conf),
      {
        method: 'POST',
        route: '/authenticator/verify',
        title: 'Verifies a TOTP against saved authenticator',
        access: ['swarm:totpNeeded'],
        accepts: {
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              code: { type: 'string', pattern: '^[0-6]{6}$' }
            }
          }
        },
        returns: [
          {
            code: 200,
            description: 'The code is valid, and a new token is issued',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' },
                token: { type: 'string' }
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
    return async function getQrCode (req: any) {
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

      const imageUrl = await qrcode.toDataURL(otpauth)

      return {
        qrcode: imageUrl
      }
    }
  }

  static validate () {
    return async function validate (req: any) {
      if (
        !req.user.swarmGoogleAuthenticatorPending ||
        !req.user.swarmGoogleAuthenticatorSecret
      )
        throw new BadRequest()

      try {
        const isValid = authenticator.verify({
          token: req.body.code,
          secret: req.user.swarmGoogleAuthenticatorSecret
        })
        if (!isValid) throw new Forbidden()
      } catch (err: any) {
        throw new Forbidden()
      }

      req.user.swarmGoogleAuthenticatorPending = false
      await req.user.save()

      return {
        status: true
      }
    }
  }

  static verifyAuthenticator (_: any, conf: AuthPluginOptions) {
    return async function verifyAuthenticator (req: any) {
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
        if (!isValid) throw new Forbidden()
      } catch {
        throw new Forbidden()
      }

      return {
        status: true,
        token: JWT.generate(
          conf,
          req.user,
          false,
          !req.user.swarmValidated && conf.validationRequired
        )
      }
    }
  }

  static delete () {
    return async function deleteAuthenticator (req: any) {
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
