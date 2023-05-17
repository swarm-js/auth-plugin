import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import jwt from 'jsonwebtoken'

export class JWT {
  static generate (conf: AuthPluginOptions, user: any) {
    const exp = Math.floor(Date.now() / 1000) + 3600

    return jwt.sign(
      {
        id: user.id,
        exp
      },
      conf.jwtKey
    )
  }
}