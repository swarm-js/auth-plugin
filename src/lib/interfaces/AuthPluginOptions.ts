import { MongooseAuthPluginOptions } from './MongooseAuthPluginOptions'

export interface AuthPluginOptions extends MongooseAuthPluginOptions {
  controllerName: string
  prefix: string
  jwtKey: string
  logo: string | null
  rpName: null | string
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
  emailField: string
  firstnameField: string
  lastnameField: string
  avatarField: string
  googleAuthenticatorService: string
}
