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

    const me = await axios.get(
      'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          Authorization: `Bearer ${token.data.access_token}`
        }
      }
    )

    const email = await axios.get(
      'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))',
      {
        headers: {
          Authorization: `Bearer ${token.data.access_token}`
        }
      }
    )

    const state = JSON.parse(query.state)

    return {
      id: me.data.id,
      email: email.data.elements?.[0]?.['handle~']?.emailAddress,
      firstname: me.data.localizedFirstName,
      lastname: me.data.localizedLastName,
      avatar:
        me.data.profilePicture?.['displayImage~'].elements?.[0].identifiers?.[0]
          ?.identifier ?? '',
      redirect: state.redirect
    }
  }
}
