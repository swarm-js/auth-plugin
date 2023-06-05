import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Unauthorized, Conflict } from 'http-errors'
import { Crypt } from './Crypt'
import { JWT } from './JWT'
import { v4 as uuid } from 'uuid'
import { Mail } from './Mail'

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
              minLength: 6,
              description: 'Password'
            }
          },
          required: ['email', 'password']
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
          },
          required: ['email', 'password']
        },
        returns: [
          {
            code: 200,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                totpNeeded: { type: 'boolean' },
                validationRequired: { type: 'boolean' },
                haveTotp: { type: 'boolean' }
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

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.changePassword(),
      {
        method: 'PUT',
        route: '/password',
        title: 'Change password',
        accepts: {
          type: 'object',
          properties: {
            newPassword: {
              type: 'string',
              minLength: 6,
              description: 'New password'
            },
            oldPassword: {
              type: 'string',
              description: 'Old password'
            }
          },
          required: ['newPassword', 'oldPassword']
        },
        returns: [
          {
            code: 200,
            description: 'Password successfully changed',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 403,
            description: 'Wrong password',
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
    return async function (request: any) {
      const existing = await conf.model.findOne({
        [conf.emailField]: request.body.email
      })
      if (existing) throw new Conflict()

      const swarmPassword = await Crypt.hash(request.body.password)

      const user = await conf.model.create({
        [conf.emailField]: request.body.email,
        swarmPassword,
        swarmValidated: false
      })

      if (conf.validationRequired) {
        await Password.askValidation(swarm, conf, user)
      }

      return {
        token: JWT.generate(conf, user, false, conf.validationRequired)
      }
    }
  }

  static async askValidation (
    swarm: any,
    conf: AuthPluginOptions,
    user: any
  ): Promise<boolean> {
    user.swarmValidationCode = uuid()
    await user.save()

    if (user.sendEmail === undefined) return false

    const html = Mail.create('Please confirm your email address')
      .header({
        logo: conf.logo,
        title: 'Please confirm your email address'
      })
      .text(
        `Please click on the button below to confirm your email address, or copy-paste the following link in your browser address bar :<br />${swarm.getOption(
          'baseUrl'
        )}${conf.prefix}/confirm-email?code=${user.swarmValidationCode}`
      )
      .button(
        'Confirm email address',
        `${swarm.getOption('baseUrl')}${conf.prefix}/confirm-email?code=${
          user.swarmValidationCode
        }`
      )

    return await user.sendEmail('Confirm your email address', html)
  }

  static login (_: any, conf: AuthPluginOptions) {
    return async function (request: any) {
      const user = await conf.model.findOne({
        [conf.emailField]: request.body.email
      })

      if (!user) throw Unauthorized()

      try {
        const passwordValid = await Crypt.verify(
          request.body.password,
          user.swarmPassword
        )
        if (!passwordValid) throw new Unauthorized()

        let totpNeeded = false
        if (
          conf.googleAuthenticator &&
          !user.swarmGoogleAuthenticatorPending &&
          user.swarmGoogleAuthenticatorSecret
        )
          totpNeeded = true

        return {
          token: JWT.generate(conf, user, totpNeeded, !user.swarmValidated),
          totpNeeded,
          validationRequired: !user.swarmValidated && conf.validationRequired,
          haveTotp:
            !!user.swarmGoogleAuthenticatorSecret &&
            !user.swarmGoogleAuthenticatorPending
        }
      } catch {
        throw new Unauthorized()
      }
    }
  }

  static changePassword () {
    return async function (request: any) {
      try {
        const passwordValid = await Crypt.verify(
          request.body.oldPassword,
          request.user.swarmPassword
        )
        if (!passwordValid) throw new Unauthorized()

        request.user.swarmPassword = await Crypt.hash(request.body.newPassword)
        await request.user.save()

        return { status: true }
      } catch {
        throw new Unauthorized()
      }
    }
  }
}
