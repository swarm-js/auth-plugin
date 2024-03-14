import axios from 'axios'
import qs from 'qs'

export class LinkedinProvider {
  async getRedirectUri (conf: any, redirect: string | null = null) {
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', conf.linkedinClientId)
    url.searchParams.set('redirect_uri', conf.linkedinRedirect)
    url.searchParams.set(
      'state',
      JSON.stringify({
        redirect
      })
    )
    url.searchParams.set('scope', 'openid profile email')
    return url.toString()
  }

  async callback (conf: any, query: any) {
    let token = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      qs.stringify({
        grant_type: 'authorization_code',
        code: query.code,
        client_id: conf.linkedinClientId,
        client_secret: conf.linkedinClientSecret,
        redirect_uri: conf.linkedinRedirect
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const me = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token.data.access_token}`
      }
    })

    const state = JSON.parse(query.state)

    return {
      id: me.data.sub,
      email: me.data.email ?? '',
      firstname: me.data.given_name ?? '',
      lastname: me.data.family_name ?? '',
      avatar: me.data.picture ?? '',
      redirect: state.redirect
    }
  }
}
