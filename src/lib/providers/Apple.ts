import axios from 'axios'

export class AppleProvider {
  async getRedirectUri (
    conf: any,
    redirect: string | null = null,
    mode: 'iframe' | 'popup' | 'redirect' = 'redirect'
  ) {
    const url = new URL('https://www.apple.com/v13.0/dialog/oauth')
    url.searchParams.set('client_id', conf.appleClientId)
    url.searchParams.set('redirect_uri', conf.appleRedirect)
    url.searchParams.set(
      'state',
      JSON.stringify({
        redirect,
        mode
      })
    )
    url.searchParams.set('scope', 'email,public_profile')
    return url.toString()
  }

  async callback (conf: any, query: any) {
    let token = await axios.get(
      'https://graph.apple.com/v13.0/oauth/access_token',
      {
        params: {
          code: query.code,
          client_id: conf.appleClientId,
          client_secret: conf.appleClientSecret,
          redirect_uri: conf.appleRedirect
        }
      }
    )

    const me = await axios.get(`https://graph.apple.com/me`, {
      params: {
        access_token: token.data.access_token,
        fields: 'id,email,first_name,last_name,picture'
      }
    })

    const state = JSON.parse(query.state)

    return {
      id: me.data.id,
      email: me.data.email,
      firstname: me.data.first_name,
      lastname: me.data.last_name,
      avatar: me.data.picture?.data?.url ?? '',
      redirect: state.redirect,
      mode: state.mode
    }
  }
}
