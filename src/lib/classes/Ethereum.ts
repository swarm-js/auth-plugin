import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { v4 as uuid } from 'uuid'
import { BadRequest, Unauthorized } from 'http-errors'
import { JWT } from './JWT'
import { verifyMessage } from 'ethers'

let nonces: any = {}

export class Ethereum {
  static setup (swarm: any, conf: AuthPluginOptions) {
    if (!conf.ethereum) return

    swarm.controllers.addMethod(conf.controllerName, Ethereum.nonce(), {
      method: 'GET',
      route: '/ethereum/nonce',
      title: 'Get nonce value',
      returns: [
        {
          code: 200,
          description: 'Nonce code and requestId',
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              nonce: { type: 'string' }
            }
          }
        }
      ]
    })

    swarm.controllers.addMethod(
      conf.controllerName,
      Ethereum.verify(swarm, conf),
      {
        method: 'POST',
        route: '/ethereum/verify',
        title: 'Validates message authenticity and logs in user',
        returns: [
          {
            code: 200,
            description: 'JWT token',
            mimeType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' }
              }
            }
          },
          {
            code: 400,
            description: 'Invalid authentication',
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

  static nonce () {
    return async function nonce () {
      const requestId: string = uuid()
      const nonce: string = uuid()
      nonces[requestId] = nonce

      return { requestId, nonce }
    }
  }

  static verify (_: any, conf: AuthPluginOptions) {
    return async function verify (request: any) {
      const { signature, address, requestId } = request.body

      if (!signature || !address || nonces[requestId] === undefined) {
        throw new BadRequest()
      }

      const expectedMessage = `Please log in to ${conf.rpName}.

Nonce: ${nonces[requestId]}
Request ID : ${requestId}`

      const signerAddress = verifyMessage(expectedMessage, signature)

      delete nonces[requestId]

      if (signerAddress.toLowerCase() !== address.toLowerCase())
        throw new Unauthorized()

      let user = await conf.model.findOne({
        swarmEthereumWallet: address
      })

      if (user) {
        return {
          token: JWT.generate(conf, user)
        }
      }

      if (!conf.register) throw new Error('Cannot register')

      user = await conf.model.create({
        swarmEthereumWallet: address.toLowerCase()
      })

      return {
        token: JWT.generate(conf, user)
      }
    }
  }
}
