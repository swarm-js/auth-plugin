import jwt from 'jsonwebtoken'
import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { Crypt } from './Crypt'

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
          req.validationRequired = !!decoded.validationRequired
          req.userToken = decoded
        } catch {}
        break
      case 'Basic':
        const [email, password]: string[] = Buffer.from(token, 'base64')
          .toString()
          .split(':')
        try {
          const user = await conf.model.findOne({
            [conf.emailField]: email
          })
          if (!user) throw new Error('User not found')

          const passwordValid = await Crypt.verify(password, user.swarmPassword)
          if (!passwordValid) throw new Error('Password not valid')

          let totpNeeded = false
          if (
            conf.googleAuthenticator &&
            !user.swarmGoogleAuthenticatorPending &&
            user.swarmGoogleAuthenticatorSecret
          )
            totpNeeded = true

          await conf.onLogin(user)

          req.user = user
          req.totpNeeded = totpNeeded
          ;(req.validationRequired =
            !user.swarmValidated && conf.validationRequired),
            (req.userToken = null)
        } catch {}
        break
    }
  }
}
