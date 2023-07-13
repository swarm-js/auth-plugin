import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import jwt from 'jsonwebtoken'

export class JWT {
  static generate (
    conf: AuthPluginOptions,
    user: any,
    totpNeeded: boolean = false,
    validationRequired: boolean = false
  ) {
    return jwt.sign(
      {
        id: user.id,
        totpNeeded,
        validationRequired
      },
      conf.jwtKey,
      { expiresIn: conf.sessionDuration }
    )
  }
}
