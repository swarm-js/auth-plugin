import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Unauthorized, Conflict, BadRequest } from 'http-errors'
import { Crypt } from './Crypt'
import { JWT } from './JWT'
import { v4 as uuid } from 'uuid'
import { Mail } from '@swarmjs/mail'

export class Password {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.password) return

    if (conf.register)
      swarm.controllers.addMethod(
        conf.controllerName,
        Password.register(swarm, conf),
        {
          method: 'POST',
          route: '/register',
          title: 'Create an account with email / password',
          accepts: {
            mimeType: 'application/json',
            schema: {
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
                },
                redirect: {
                  type: 'string',
                  description: 'Redirection URL after confirming the email'
                }
              },
              required: ['email', 'password']
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
                  token: { type: 'string' },
                  validationRequired: { type: 'boolean' }
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
          mimeType: 'application/json',
          schema: {
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
          mimeType: 'application/json',
          schema: {
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
          }
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

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.magicLink(swarm, conf),
      {
        method: 'POST',
        route: '/magic-link',
        title: 'Log in with a magic link',
        accepts: {
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'Email address'
              },
              redirect: {
                type: 'string',
                description: 'Redirection URL after confirming the email'
              }
            },
            required: ['email', 'redirect']
          }
        },
        returns: [
          {
            code: 200,
            description: 'Magic link sent by email',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.processMagicLink(swarm, conf),
      {
        method: 'GET',
        route: '/magic-link',
        title: 'Log in with a magic link',
        query: [
          {
            name: 'code',
            description: 'Login code',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          {
            name: 'redirect',
            description: 'Redirection URL',
            schema: {
              type: 'string'
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Password.acceptInvitation(swarm, conf),
      {
        method: 'POST',
        route: '/accept-invitation',
        title: 'Log in with a magic link',
        accepts: {
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                format: 'uuid',
                description: 'Invitation code'
              },
              password: {
                type: 'string',
                minLength: 6,
                description: 'Password'
              }
            },
            required: ['code', 'password']
          }
        },
        returns: [
          {
            code: 200,
            description: 'Registered user JWT token',
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
            description: 'Wrong invitation code',
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

  static acceptInvitation (_: any, conf: AuthPluginOptions) {
    return async function acceptInvitation (request: any) {
      const user = await conf.model.findOne({
        swarmInvitationCode: request.body.code
      })
      if (!user) throw new Unauthorized()

      user.swarmPassword = await Crypt.hash(request.body.password)
      user.swarmInvited = false
      user.swarmInvitationCode = ''
      user.swarmValidated = true
      await user.save()

      return {
        token: JWT.generate(conf, user, false, false)
      }
    }
  }

  static register (swarm: any, conf: AuthPluginOptions) {
    return async function register (request: any) {
      request.body.email = request.body.email.trim().toLowerCase()

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
        await Password.askValidation(
          request,
          swarm,
          conf,
          user,
          request.body.redirect
        )
      }

      return {
        token: JWT.generate(conf, user, false, conf.validationRequired),
        validationRequired: conf.validationRequired
      }
    }
  }

  static async askValidation (
    request: any,
    swarm: any,
    conf: AuthPluginOptions,
    user: any,
    redirect?: string
  ): Promise<boolean> {
    user.swarmValidationCode = uuid()
    await user.save()

    if (user.sendEmail === undefined) return false

    const validationUrl = `${swarm.getOption('baseUrl')}${
      conf.prefix
    }/confirm-email?code=${
      user.swarmValidationCode
    }&redirect=${encodeURIComponent(redirect ?? '')}`

    const html = Mail.create(
      request.$t('Please confirm your email address', {}, null, 'auth-plugin')
    )
      .header({
        logo: conf.logo,
        title: request.$t(
          'Please confirm your email address',
          {},
          null,
          'auth-plugin'
        )
      })
      .text(
        request.$t(
          `Please click on the button below to confirm your email address, or copy-paste the following link in your browser address bar :<br />{url}`,
          { url: validationUrl },
          null,
          'auth-plugin'
        )
      )
      .button(
        request.$t('Confirm your email address', {}, null, 'auth-plugin'),
        validationUrl
      )
      .end()

    return await user.sendEmail(
      request.$t('Confirm your email address', {}, null, 'auth-plugin'),
      html
    )
  }

  static login (_: any, conf: AuthPluginOptions) {
    return async function login (request: any) {
      request.body.email = request.body.email.trim().toLowerCase()

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
          token: JWT.generate(
            conf,
            user,
            totpNeeded,
            !user.swarmValidated && conf.validationRequired
          ),
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
    return async function changePassword (request: any) {
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

  static magicLink (swarm: any, conf: AuthPluginOptions) {
    return async function magicLink (request: any) {
      const user = await conf.model.findOne({
        [conf.emailField]: request.body.email
      })

      if (user) {
        user.swarmMagicLinkCode = uuid()
        user.swarmMagicLinkValidity = +new Date() + 15 * 60 * 1000
        await user.save()

        if (user.sendEmail === undefined) return false

        const linkUrl = `${swarm.getOption('baseUrl')}${
          conf.prefix
        }/magic-link?code=${
          user.swarmMagicLinkCode
        }&redirect=${encodeURIComponent(request.body.redirect ?? '')}`

        const html = Mail.create(
          request.$t('Magic link', {}, null, 'auth-plugin')
        )
          .header({
            logo: conf.logo,
            title: request.$t(
              'Login with a magic link',
              {},
              null,
              'auth-plugin'
            )
          })
          .text(
            request.$t(
              `Please click on the button below to log in, or copy-paste the following link in your browser address bar :<br />{url}`,
              { url: linkUrl },
              null,
              'auth-plugin'
            )
          )
          .button(request.$t('Log in', {}, null, 'auth-plugin'), linkUrl)
          .end()

        return await user.sendEmail(
          request.$t(
            'Log in to {name}',
            { name: conf.rpName },
            null,
            'auth-plugin'
          ),
          html
        )
      }

      return {
        status: true
      }
    }
  }

  static processMagicLink (_: any, conf: AuthPluginOptions) {
    return async function processMagicLink (request: any, reply: any) {
      if (
        request.query.code === undefined ||
        request.query.redirect === undefined
      )
        throw new BadRequest()

      const user = await conf.model.findOne({
        swarmMagicLinkCode: request.query.code ?? 'wrong-code',
        swarmMagicLinkValidity: {
          $gte: +new Date()
        }
      })
      const redirect = new URL(request.query.redirect)

      if (user) {
        user.swarmMagicLinkCode = ''
        await user.save()

        const token = JWT.generate(
          conf,
          user,
          false,
          !user.swarmValidated && conf.validationRequired
        )

        if (
          (conf.allowedDomains ?? []).length &&
          (conf.allowedDomains ?? []).includes(redirect.host) === false
        )
          throw new Unauthorized()

        redirect.searchParams.set('token', token)
      }

      reply.redirect(redirect.toString())
    }
  }
}
