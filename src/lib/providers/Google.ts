import { google } from 'googleapis'

export class GoogleProvider {
  getConnection (conf: any) {
    return new google.auth.OAuth2(
      conf.googleClientId,
      conf.googleClientSecret,
      conf.googleRedirect
    )
  }

  async getRedirectUri (
    conf: any,
    redirect: string | null = null,
    mode: 'iframe' | 'popup' | 'redirect' = 'redirect'
  ) {
    const connection = this.getConnection(conf)
    return connection.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: JSON.stringify({ redirect, mode })
    })
  }

  async callback (conf: any, query: any) {
    const auth = this.getConnection(conf)
    const data = await auth.getToken(query.code)
    const tokens = data.tokens
    auth.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth,
      version: 'v2'
    })
    const me = await oauth2.userinfo.get()

    const state = JSON.parse(query.state)

    return {
      id: me.data.id,
      email: (me.data?.email ?? '').trim(),
      firstname: (me.data?.given_name ?? '').trim(),
      lastname: (me.data?.family_name ?? '').trim(),
      avatar: (me.data?.picture ?? '').trim(),
      redirect: state.redirect,
      mode: state.mode
    }
  }
}
