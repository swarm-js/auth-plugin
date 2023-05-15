import { MongooseAuthPluginOptions } from '../interfaces/MongooseAuthPluginOptions'

export function MongooseAuthPlugin (
  schema: any,
  options: Partial<MongooseAuthPluginOptions>
): void {
  const conf: MongooseAuthPluginOptions = {
    password: true,
    fido2: false,
    passkey: false,
    facebook: false,
    google: false,
    microsoft: false,
    apple: false,
    googleAuthenticator: false,
    ...options
  }

  if (conf.password) schema.add({ swarmPassword: 'string' })
  if (conf.facebook) schema.add({ swarmFacebookId: 'string' })
  if (conf.google) schema.add({ swarmGoogleId: 'string' })
  if (conf.microsoft) schema.add({ swarmMicrosoftId: 'string' })
  if (conf.apple) schema.add({ swarmAppleId: 'string' })
  if (conf.googleAuthenticator)
    schema.add({ swarmGoogleAuthenticatorSecret: 'string' })
  if (conf.fido2)
    schema.add({
      swarmFido2Credentials: [
        {
          deviceName: String,
          challenge: Buffer,
          authChallenge: Buffer,
          publicKey: String,
          prevCounter: Number
        }
      ]
    })
  if (conf.passkey)
    schema.add({
      swarmPasskeyCurrentChallenge: String,
      swarmPasskeys: [
        {
          credentialID: { type: String, index: true },
          credentialPublicKey: Buffer,
          counter: Number,
          credentialDeviceType: String,
          credentialBackedUp: Boolean,
          transports: [{ type: String }]
        }
      ]
    })
}
