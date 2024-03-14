interface AuthFidoCredentials {
  id: string
  deviceName: string
  challenge: any
  authChallenge: any
  publicKey: string
  prevCounter: number
}

export interface AuthFields {
  swarmUserAccess: string[]
  swarmValidated: boolean
  swarmValidationCode: string
  swarmMagicLinkCode: string
  swarmMagicLinkValidity: number
  swarmPassword: string
  swarmFacebookId: string
  swarmGoogleId: string
  swarmLinkedinId: string
  swarmGoogleAuthenticatorSecret: string
  swarmGoogleAuthenticatorPending: boolean
  swarmEthereumWallet: string
  swarmInvited: boolean
  swarmInvitationCode: string
  swarmFido2Credentials: AuthFidoCredentials[]
}
