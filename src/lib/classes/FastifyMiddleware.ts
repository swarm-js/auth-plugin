import jwt from 'jsonwebtoken'
import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export function fastifyMiddleware (conf: AuthPluginOptions) {
  return async function (req: any) {
    if (req.headers.authorization === undefined) return

    const [mode, token] = req.headers.authorization.split(' ')

    switch (mode) {
      case 'Bearer':
        try {
          const decoded: any = jwt.verify(token, conf.jwtKey)
          req.user = await conf.model.findById(decoded.id)
          req.totpNeeded = !!decoded.totpNeeded
          req.userToken = decoded
        } catch {}
        break
    }
  }
}
