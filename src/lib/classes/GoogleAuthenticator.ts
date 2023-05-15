import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export class GoogleAuthenticator {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.googleAuthenticator) return
    // Use https://github.com/yeojz/otplib
  }
}
