<script setup lang="ts">
import Color from 'color'
import { useStyleTag } from '@vueuse/core'
import PageLogin from './pages/Login.vue'
import PageRegister from './pages/Register.vue'
import PageEmailConfirmed from './pages/EmailConfirmed.vue'
import PageEmailNotConfirmed from './pages/EmailNotConfirmed.vue'
import PageMagicLink from './pages/MagicLink.vue'
import PageAcceptInvitation from './pages/AcceptInvitation.vue'

declare global {
  interface Window {
    AuthPluginConf: any
    AuthPluginPage: string
  }
}

const conf = {
  logo: '',
  themeColor: '#8500d2',
  baseUrl: '/',
  rpName: '',
  password: true,
  fido2: false,
  facebook: false,
  google: false,
  linkedin: false,
  googleAuthenticator: false,
  ethereum: false,
  ...(window.AuthPluginConf ?? {})
}

const lightColor = Color(conf.themeColor).lighten(0.5).hex()
const darkColor = Color(conf.themeColor).darken(0.5).hex()

useStyleTag(`body {
  background: ${conf.themeColor};
  background: -webkit-linear-gradient(-135deg,${lightColor},${darkColor});
  background: -o-linear-gradient(-135deg,${lightColor},${darkColor});
  background: -moz-linear-gradient(-135deg,${lightColor},${darkColor});
  background: linear-gradient(-135deg,${lightColor},${darkColor});
}
`)

const page = window.AuthPluginPage ?? 'login'
</script>

<template>
  <main>
    <div class="modal">
      <div
        class="logo"
        :style="{
          backgroundImage: `url(${conf.logo})`,
          backgroundColor: conf.logoBackgroundColor
        }"
        v-if="(conf.logo ?? '').length"
      ></div>
      <PageLogin v-if="page === 'login'" :conf="conf" />
      <PageRegister v-if="page === 'register'" :conf="conf" />
      <PageEmailConfirmed v-if="page === 'emailConfirmed'" :conf="conf" />
      <PageEmailNotConfirmed v-if="page === 'emailNotConfirmed'" :conf="conf" />
      <PageMagicLink v-if="page === 'magiclink'" :conf="conf" />
      <PageAcceptInvitation v-if="page === 'acceptinvitation'" :conf="conf" />
    </div>
  </main>
</template>

<style lang="scss">
#app {
  height: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: auto;

  main {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    min-height: 100vh;
    min-height: 100dvh;

    .modal {
      max-width: 442px;
      width: 100%;
      margin: 68px 20px 20px 20px;
      background: #fff;
      padding: 40px;
      border-radius: 4px;
      box-shadow: 0px 0px 20px 5px rgba(0, 0, 0, 0.1);

      .logo {
        height: 96px;
        width: 96px;
        margin: -88px auto 20px auto;
        border: 5px solid #fff;
        border-radius: 96px;
        background: #fff no-repeat center center;
        background-size: cover;
      }

      h1 {
        font-weight: 700;
        text-align: center;
        text-transform: uppercase;
        font-size: 30px;
        color: #333;
        line-height: 1.2;
        text-transform: uppercase;
        margin-bottom: 20px;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
    }
  }
}
</style>
