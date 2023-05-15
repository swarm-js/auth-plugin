import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'

export class Passkey {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.passkey) return
    // Use https://simplewebauthn.dev/docs/packages/server
  }
}
