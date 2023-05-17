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
    ethereum: false,
    ...options
  }

  schema.add({
    swarmUserAccess: [String],
    swarmValidated: { type: Boolean, default: false },
    swarmValidationCode: { type: String }
  })

  if (conf.password) schema.add({ swarmPassword: 'string' })
  if (conf.facebook) schema.add({ swarmFacebookId: 'string' })
  if (conf.google) schema.add({ swarmGoogleId: 'string' })
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
  if (conf.ethereum) schema.add({ swarmEthereumWallet: 'string' })
}
