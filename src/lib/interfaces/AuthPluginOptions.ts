import { MongooseAuthPluginOptions } from './MongooseAuthPluginOptions'

export interface AuthPluginOptions extends MongooseAuthPluginOptions {
  controllerName: string
  jwtKey: string
  themeColor: string
  rpId: null | string
  origin: null | string
  model: any
  validationRequired: boolean
  googleClientId: string
  googleClientSecret: string
  googleRedirect: string
  facebookClientId: string
  facebookClientSecret: string
  facebookRedirect: string
  firstnameField: string
  lastnameField: string
  avatarField: string
  googleAuthenticatorService: string
  allowedDomains: string[]
  userAccess: (req: any) => string | string[]
}
