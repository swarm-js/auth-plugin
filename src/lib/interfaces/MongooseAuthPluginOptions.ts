export interface MongooseAuthPluginOptions {
  accentColor?: string
  password: boolean
  fido2: boolean
  facebook: boolean
  google: boolean
  linkedin: boolean
  googleAuthenticator: boolean
  ethereum: boolean
  invite: boolean
  emailField: string
  logo: string | null
  rpName: null | string
  prefix: string
  register: boolean
}
