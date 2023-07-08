import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import {
  ExpectedAssertionResult,
  ExpectedAttestationResult,
  Fido2Lib
} from 'fido2-lib'
import { v4 as uuid } from 'uuid'
import { NotFound, Forbidden } from 'http-errors'
import base64url from 'base64url'
import { JWT } from './JWT'

let fido: Fido2Lib

export class Fido2 {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.fido2) return

    if (conf.rpId === null) throw new Error('rpId is not defined')
    if (conf.rpName === null) throw new Error('rpName is not defined')
    if (conf.logo === null) throw new Error('Logo is not defined')
    if (conf.origin === null) throw new Error('Origin is not defined')

    fido = new Fido2Lib({
      timeout: 120000,
      rpId: conf.rpId as string,
      rpName: conf.rpName as string,
      rpIcon: conf.logo as string,
      challengeSize: 128,
      attestation: 'none',
      cryptoParams: [-7, -257],
      authenticatorAttachment: 'platform',
      authenticatorRequireResidentKey: false,
      authenticatorUserVerification: 'required'
    })

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Init(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/init',
        title: 'Initialize FIDO2 configuration',
        access: ['swarm:loggedIn'],
        accepts: {
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              deviceName: {
                type: 'string'
              }
            }
          }
        },
        returns: [
          {
            code: 200,
            description: 'Auth parameters for FIDO, browser side',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                cred: {
                  type: 'string',
                  format: 'uuid'
                },
                registrationOptions: {
                  type: 'object',
                  properties: {
                    attestation: { type: 'string' },
                    authenticatorSelection: {
                      type: 'object',
                      properties: {
                        authenticatorAttachment: { type: 'string' },
                        requireResidentKey: { type: 'boolean' },
                        userVerification: { type: 'string' }
                      }
                    },
                    challenge: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        data: {
                          type: 'array',
                          items: {
                            type: 'number'
                          }
                        }
                      }
                    },
                    pubKeyCredParams: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          alg: { type: 'number' }
                        }
                      }
                    },
                    rp: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        icon: { type: 'string' }
                      }
                    },
                    timeout: { type: 'number' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        displayName: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Register(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/register',
        title: 'Register FIDO2 credentials',
        access: ['swarm:loggedIn'],
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        returns: [
          {
            code: 200,
            description: 'The user correctly authenticated himself with FIDO2',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 403,
            description: 'Wrong credentials',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          },
          {
            code: 404,
            description: 'Credentials not found',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2AuthOptions(swarm, conf),
      {
        method: 'GET',
        route: '/fido2/:id/auth-options',
        title: 'Get FIDO2 auth options',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        returns: [
          {
            code: 200,
            description: 'Auth options for FIDO, browser side',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                challenge: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { type: 'number' }
                    }
                  }
                },
                rpId: { type: 'string' },
                timeout: { type: 'number' },
                userVerification: { type: 'string' }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Authenticate(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/authenticate',
        title: 'Authenticate logged in user with FIDO2 credentials',
        access: ['swarm:loggedIn'],
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        returns: [
          {
            code: 200,
            description: 'The user correctly authenticated himself with FIDO2',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                status: { type: 'boolean' }
              }
            }
          },
          {
            code: 403,
            description: 'Wrong credentials',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          },
          {
            code: 404,
            description: 'Credentials not found',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          }
        ]
      }
    )

    swarm.controllers.addMethod(
      conf.controllerName,
      Fido2.fido2Login(swarm, conf),
      {
        method: 'POST',
        route: '/fido2/:id/login',
        title: 'Logs in a user with credentials',
        parameters: [
          {
            name: 'id',
            description: 'Credential ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        returns: [
          {
            code: 200,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                validationRequired: { type: 'boolean' }
              }
            }
          },
          {
            code: 403,
            description: 'Wrong credentials',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          },
          {
            code: 404,
            description: 'Credentials not found',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'number' },
                code: { type: 'string' },
                error: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' }
              }
            }
          }
        ]
      }
    )
  }

  static fido2Init (_: any, conf: AuthPluginOptions) {
    return async function fido2Init (request: any) {
      const registrationOptions = await fido.attestationOptions()

      const id = uuid()
      request.user.swarmFido2Credentials.push({
        id,
        deviceName: request.body.deviceName,
        challenge: Buffer.from(registrationOptions.challenge)
      })
      request.user.markModified('swarmFido2Credentials')
      await request.user.save()

      registrationOptions.user.id = id
      registrationOptions.user.name = request.user[conf.emailField]
      registrationOptions.user.displayName = `${
        request.user[conf.firstnameField]
      } ${request.user[conf.lastnameField]}`.trim()
      registrationOptions.challenge = Buffer.from(registrationOptions.challenge)

      return {
        cred: id,
        registrationOptions
      }
    }
  }

  static fido2Register (_: any, conf: AuthPluginOptions) {
    return async function fido2Register (request: any) {
      const { credential } = request.body

      const _this = request.user.swarmFido2Credentials.find(
        (c: any) => c.id === request.params.id
      )
      if (!_this) throw new NotFound()

      const challenge = new Uint8Array(_this.challenge).buffer
      credential.rawId = new Uint8Array(
        Buffer.from(credential.rawId, 'base64')
      ).buffer
      credential.response.attestationObject = base64url.decode(
        credential.response.attestationObject,
        'base64'
      )
      credential.response.clientDataJSON = base64url.decode(
        credential.response.clientDataJSON,
        'base64'
      )

      const attestationExpectations: ExpectedAttestationResult = {
        challenge: Buffer.from(challenge).toString('base64url'),
        origin: conf.origin as string,
        factor: 'either'
      }

      try {
        const regResult = await fido.attestationResult(
          credential,
          attestationExpectations
        )

        request.user.swarmFido2Credentials =
          request.user.swarmFido2Credentials.map((c: any) => {
            if (c.id === request.params.id) {
              c.publicKey = regResult.authnrData.get('credentialPublicKeyPem')
              c.prevCounter = regResult.authnrData.get('counter')
            }
            return c
          })
        request.user.markModified('swarmFido2Credentials')
        await request.user.save()

        return { status: true }
      } catch (err: any) {
        console.log(err.message)
        throw new Forbidden()
      }
    }
  }

  static fido2AuthOptions (_: any, conf: AuthPluginOptions) {
    return async function fido2AuthOptions (request: any) {
      const authnOptions = await fido.assertionOptions()

      const user = await conf.model.findOne({
        'swarmFido2Credentials.id': request.params.id
      })
      if (!user) throw new NotFound()

      user.swarmFido2Credentials = user.swarmFido2Credentials.map((c: any) => {
        if (c.id === request.params.id) {
          c.authChallenge = Buffer.from(authnOptions.challenge)
        }
        return c
      })

      await user.save()

      authnOptions.challenge = Buffer.from(authnOptions.challenge)

      return authnOptions
    }
  }

  static fido2Authenticate (_: any, conf: AuthPluginOptions) {
    return async function fido2Authenticate (request: any) {
      const { credential } = request.body

      const _this = request.user.swarmFido2Credentials.find(
        (c: any) => c.id === request.params.id
      )
      if (!_this) throw new NotFound()

      credential.rawId = new Uint8Array(
        Buffer.from(credential.rawId, 'base64')
      ).buffer

      const challenge = new Uint8Array(_this.authChallenge).buffer

      if (_this.publicKey === 'undefined' || _this.prevCounter === undefined) {
        throw new Forbidden()
      } else {
        const assertionExpectations: ExpectedAssertionResult = {
          challenge: Buffer.from(challenge).toString('base64url'),
          origin: conf.origin as string,
          factor: 'either',
          publicKey: _this.publicKey,
          prevCounter: _this.prevCounter,
          userHandle: new Uint8Array(Buffer.from(_this.id)).buffer.toString()
        }

        try {
          await fido.assertionResult(credential, assertionExpectations)
          return { status: true }
        } catch {
          throw new Forbidden()
        }
      }
    }
  }

  static fido2Login (_: any, conf: AuthPluginOptions) {
    return async function fido2Login (request: any) {
      const user = await conf.model.findOne({
        'swarmFido2Credentials.id': request.params.id
      })
      if (!user) throw new NotFound()

      const { credential } = request.body

      const _this = user.swarmFido2Credentials.find(
        (c: any) => c.id === request.params.id
      )
      if (!_this) throw new NotFound()

      credential.rawId = new Uint8Array(
        Buffer.from(credential.rawId, 'base64')
      ).buffer

      const challenge = new Uint8Array(_this.authChallenge).buffer

      if (_this.publicKey === 'undefined' || _this.prevCounter === undefined) {
        throw new Forbidden()
      } else {
        const assertionExpectations: ExpectedAssertionResult = {
          challenge: Buffer.from(challenge).toString('base64url'),
          origin: conf.origin as string,
          factor: 'either',
          publicKey: _this.publicKey,
          prevCounter: _this.prevCounter,
          userHandle: new Uint8Array(Buffer.from(_this.id)).buffer.toString()
        }

        try {
          await fido.assertionResult(credential, assertionExpectations)
          await conf.onLogin(user)
          return {
            token: JWT.generate(conf, user, false, !user.swarmValidated),
            validationRequired: !user.swarmValidated && conf.validationRequired
          }
        } catch {
          throw new Forbidden()
        }
      }
    }
  }
}
