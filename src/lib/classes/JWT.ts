import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import jwt from 'jsonwebtoken'

export class JWT {
  static generate (
    conf: AuthPluginOptions,
    user: any,
    totpNeeded: boolean = false,
    validationRequired: boolean = false
  ) {
    const exp = Math.floor(Date.now() / 1000) + conf.sessionDuration

    return jwt.sign(
      {
        id: user.id,
        totpNeeded,
        validationRequired,
        exp
      },
      conf.jwtKey
    )
  }
}
