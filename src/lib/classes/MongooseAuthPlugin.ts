import { MongooseAuthPluginOptions } from '../interfaces/MongooseAuthPluginOptions'
import { v4 as uuid } from 'uuid'
import { Conflict, InternalServerError } from 'http-errors'
import { Mail } from '@swarmjs/mail'

export function MongooseAuthPlugin (
  schema: any,
  options: Partial<MongooseAuthPluginOptions>
): void {
  const conf: MongooseAuthPluginOptions = {
    password: true,
    fido2: false,
    facebook: false,
    google: false,
    linkedin: false,
    googleAuthenticator: false,
    ethereum: false,
    invite: false,
    emailField: 'email',
    logo: null,
    rpName: '',
    prefix: '/auth',
    register: true,
    ...options
  }

  schema.add({
    swarmUserAccess: [String],
    swarmValidated: { [schema.get('typeKey')]: Boolean, default: false },
    swarmValidationCode: { [schema.get('typeKey')]: String },
    swarmMagicLinkCode: { [schema.get('typeKey')]: String },
    swarmMagicLinkValidity: { [schema.get('typeKey')]: Number }
  })

  if (conf.password) schema.add({ swarmPassword: 'string' })
  if (conf.facebook) schema.add({ swarmFacebookId: 'string' })
  if (conf.google) schema.add({ swarmGoogleId: 'string' })
  if (conf.linkedin) schema.add({ swarmLinkedinId: 'string' })
  if (conf.googleAuthenticator)
    schema.add({
      swarmGoogleAuthenticatorSecret: 'string',
      swarmGoogleAuthenticatorPending: 'boolean'
    })
  if (conf.fido2)
    schema.add({
      swarmFido2Credentials: [
        {
          id: String,
          deviceName: String,
          challenge: Buffer,
          authChallenge: Buffer,
          publicKey: String,
          prevCounter: Number
        }
      ]
    })
  if (conf.ethereum) schema.add({ swarmEthereumWallet: 'string' })
  if (conf.invite) {
    schema.add({
      swarmInvited: 'boolean',
      swarmInvitationCode: 'string'
    })
    schema.static(
      'invite',
      async function invite (
        request: any,
        email: string,
        redirect: string,
        preset: { [key: string]: any } = {},
        overwrite: boolean = false
      ) {
        email = email.trim().toLowerCase()

        let user = await this.findOne({
          [conf.emailField]: email
        })
        if (user && !overwrite) throw new Conflict()
        if (!user)
          user = await this.create({
            [conf.emailField]: email,
            swarmInvited: true,
            swarmInvitationCode: uuid(),
            swarmValidated: false,
            ...preset
          })
        else {
          for (let key in preset) {
            user.set(key, preset[key])
          }
          await user.save()
        }

        if (user.sendEmail === undefined)
          throw new Error(
            'Cannot send email, no email provider has been installed'
          )

        const swarmOptions: { [key: string]: any } = JSON.parse(
          process.env.SWARM_OPTIONS ?? '{}'
        )

        const invitationUrl = `${swarmOptions?.baseUrl ?? ''}${
          conf.prefix
        }/accept-invitation?code=${
          user.swarmInvitationCode
        }&redirect=${encodeURIComponent(redirect ?? '')}`

        const html = Mail.create(
          request.$t(
            `You have been invited to {name} !`,
            {
              name: conf.rpName
            },
            null,
            'auth-plugin'
          )
        )
          .header({
            logo: conf.logo,
            title: request.$t(
              'You have been invited to register to {name}',
              { name: conf.rpName },
              null,
              'auth-plugin'
            )
          })
          .text(
            request.$t(
              'Please click on the button below to accept your invitation and create your account, or copy-paste the following link in your browser address bar :<br />{url}',
              { url: invitationUrl },
              null,
              'auth-plugin'
            )
          )
          .button(
            request.$t('Accept invitation', {}, null, 'auth-plugin'),
            invitationUrl
          )
          .end()

        const sent = await user.sendEmail(
          request.$t(
            `You have been invited to {name} !`,
            {
              name: conf.rpName
            },
            null,
            'auth-plugin'
          ),
          html
        )

        if (!sent) throw new InternalServerError()

        return user
      }
    )
  }
}
