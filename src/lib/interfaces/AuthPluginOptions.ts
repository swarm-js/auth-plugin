import { MongooseAuthPluginOptions } from './MongooseAuthPluginOptions'

export interface AuthPluginOptions extends MongooseAuthPluginOptions {
  controllerName: string
  jwtKey: string
  themeColor: string
  accentColor?: string
  logoBackgroundColor: string
  noGradient?: boolean
  rpId: null | string
  origin: null | string
  model: any
  validationRequired: boolean
  requireOldPasswordForUpdate: boolean
  askForName: boolean
  googleClientId: string
  googleClientSecret: string
  googleRedirect: string
  linkedinClientId: string
  linkedinClientSecret: string
  linkedinRedirect: string
  facebookClientId: string
  facebookClientSecret: string
  facebookRedirect: string
  firstnameField: string
  lastnameField: string
  avatarField: string
  googleAuthenticatorService: string
  allowedDomains: string[]
  sessionDuration: number
  userAccess: (req: any) => string | string[]
  onLogin: (user: any) => Promise<void>
}
