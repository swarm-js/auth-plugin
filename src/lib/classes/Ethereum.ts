import { AuthPluginOptions } from '../interfaces/AuthPluginOptions'
import { generateNonce, SiweMessage } from 'siwe'
import { v4 as uuid } from 'uuid'
import { BadRequest } from 'http-errors'
import { JWT } from './JWT'

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
    return async function () {
      const requestId: string = uuid()
      const nonce: string = generateNonce()
      nonces[requestId] = nonce

      return { requestId, nonce }
    }
  }

  static verify (_: any, conf: AuthPluginOptions) {
    return async function (request: any) {
      const { message, signature, requestId } = request.body

      if (!message || !signature) {
        throw new BadRequest()
      }

      let siweObj = new SiweMessage(message)
      const { data } = await siweObj.verify({
        signature,
        nonce: nonces[requestId]
      })
      delete nonces[requestId]

      let user = await conf.model.findOne({
        swarmEthereumWallet: data.address
      })

      if (user) {
        return {
          token: JWT.generate(conf, user)
        }
      }

      user = await conf.model.create({
        swarmEthereumWallet: data.address
      })

      return {
        token: JWT.generate(conf, user)
      }
    }
  }
}
