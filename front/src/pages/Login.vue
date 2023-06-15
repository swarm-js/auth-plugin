<template>
  <div class="loading" v-if="loading">
    <Loader :color="conf.themeColor" />
  </div>
  <div class="error" v-else-if="error">
    <h1>{{ $t('error.title') }}</h1>
    <p>{{ errorMsg }}</p>
  </div>
  <div class="login ask-totp" v-else-if="askTotpOpened">
    <h1>{{ $t('login.askTotpTitle') }}</h1>
    <p>{{ $t('login.askTotpDesc') }}</p>
    <div class="alert" v-if="totpError">{{ $t('login.totpError') }}</div>
    <input
      v-model="totpCode"
      class="biginput"
      @keyup.enter="sendTotp"
      maxlength="6"
    />
    <button
      :disabled="/^[0-9]{6}$/.test(totpCode) === false"
      :style="{
        background: conf.themeColor,
        color:
          fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
      }"
      @click="sendTotp"
    >
      {{ $t('login.ok') }}
    </button>
    <div class="more" style="text-align: center">
      <a href="#" @click.native.prevent="cancelTotp">
        {{ $t('login.cancel') }}
      </a>
    </div>
  </div>
  <div class="login propose-totp" v-else-if="proposeTotpOpened">
    <h1>{{ $t('login.proposeTotpTitle') }}</h1>
    <p>{{ $t('login.proposeTotpDesc') }}</p>
    <img :src="totpQrcode" alt="QRCode" />
    <div class="alert" v-if="totpError">{{ $t('login.totpError') }}</div>
    <input
      v-model="totpCode"
      class="biginput"
      maxlength="6"
      @keyup.enter="validateNewTotp"
    />
    <button
      :disabled="/^[0-9]{6}$/.test(totpCode) === false"
      :style="{
        background: conf.themeColor,
        color:
          fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
      }"
      @click="validateNewTotp"
    >
      {{ $t('login.ok') }}
    </button>
    <div class="more" style="text-align: center">
      <a href="#" @click.native.prevent="cancelNewTotp">
        {{ $t('login.noThanks') }}
      </a>
    </div>
  </div>
  <div class="login propose-fido" v-else-if="proposeFidoOpened">
    <h1>{{ $t('login.proposeFidoTitle') }}</h1>
    <p>{{ $t('login.proposeFidoDesc') }}</p>
    <img
      src="data:image/png;base64,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"
      alt="Fingerprint"
      style="height: 64px; width: 64px"
    />

    <button
      :style="{
        background: conf.themeColor,
        color:
          fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
      }"
      @click="doRegisterFido"
    >
      {{ $t('login.proposeFidoOk') }}
    </button>
    <div class="more" style="text-align: center">
      <a href="#" @click.native.prevent="cancelFido">
        {{ $t('login.noThanks') }}
      </a>
    </div>
  </div>
  <div class="login" v-else>
    <h1>{{ $t('login.title') }}</h1>

    <div class="alert" v-if="loginError">{{ loginErrorMessage }}</div>

    <form @submit.native.prevent="tryLogin" v-if="conf.password">
      <label>
        {{ $t('login.email') }}
        <input type="email" v-model="form.email" />
      </label>
      <label>
        {{ $t('login.password') }}
        <input
          type="password"
          v-model="form.password"
          @keyup.enter="tryLogin"
        />
      </label>
      <button
        :disabled="!allowLogin"
        :style="{
          background: conf.themeColor,
          color:
            fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
        }"
      >
        {{ $t('login.button') }}
      </button>
      <div class="more">
        {{ $t('login.registerPrompt') }}
        <a
          :href="
            conf.prefix + '/register?redirect=' + encodeURIComponent(redirect)
          "
        >
          {{ $t('login.registerButton') }}
        </a>
      </div>
      <div class="more">
        {{ $t('login.magiclinkPrompt') }}
        <a
          :href="
            conf.prefix +
            '/ask-magic-link?redirect=' +
            encodeURIComponent(redirect)
          "
          >{{ $t('login.magiclinkButton') }}</a
        >
      </div>
    </form>
    <div class="separator" v-if="displayOr">
      <div class="bar"></div>
      <div class="label">{{ $t('login.or') }}</div>
      <div class="bar"></div>
    </div>
    <SocialButtons :conf="conf" :redirect="redirect" @error="handleError" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import fontColorContrast from 'font-color-contrast'
import { reactive, computed, ref } from 'vue'
import SocialButtons from '../components/SocialButtons.vue'
import Loader from '../components/Loader.vue'
import { useApi } from '../composables/useApi'
import {
  canSetupFido,
  isFidoSetup,
  registerFido,
  loginFido
} from '../composables/fido'

const { t: $t } = useI18n()

const { conf } = defineProps({
  conf: {}
})

const api = useApi(conf.prefix)

let query = new URL(document.location).searchParams
let redirect = query.get('redirect')
let token = query.get('token')
let error = false
let errorMsg = ''
let loginError = ref(false)
let loginErrorMessage = ref('')
let loading = ref(true)
let askTotpOpened = ref(false)
let proposeTotpOpened = ref(false)
let totpCode = ref('')
let totpError = ref(false)
let totpToken = ref('')
let totpQrcode = ref('')
let proposeFidoOpened = ref(false)
let fidoToken = ref('')
let resolve = null
let reject = null

if (!redirect) {
  error = true
  errorMsg = $t('login.errors.noRedirect')
} else {
  try {
    const domain = new URL(redirect).host
    if (
      (conf.allowedDomains ?? []).length &&
      (conf.allowedDomains ?? []).includes(domain) === false
    )
      throw new Error('Domain not allowed')
    if (token) {
      const url = new URL(redirect)
      url.searchParams.set('token', token)
      window.location.href = url.toString()
    } else if (conf.fido2 && isFidoSetup()) {
      tryFidoLogin()
    }
  } catch (err) {
    console.log(err.message)
    error = true
    errorMsg = $t('login.errors.nonAllowedRedirect')
  }
}

async function doRegisterFido() {
  await registerFido(api, fidoToken.value, navigator.userAgent)
  proposeFidoOpened.value = false
  resolve()
}

function cancelFido() {
  proposeFidoOpened.value = false
  resolve()
}

async function proposeFido(token: string) {
  return new Promise(async (res, rej) => {
    resolve = res
    reject = rej
    fidoToken.value = token
    proposeFidoOpened.value = true
  })
}

async function tryFidoLogin() {
  const token = await loginFido(api)
  if (token) {
    const url = new URL(redirect)
    url.searchParams.set('token', token)
    window.location.href = url.toString()
  }
}

loading.value = false

const form = reactive({ email: '', password: '' })
const displayOr =
  conf.password && (conf.facebook || conf.google || conf.ethereum)

const allowLogin = computed(_ => {
  return (
    form.email.length &&
    form.email.match(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm) &&
    form.password.length
  )
})

function handleError(msg) {
  loginErrorMessage.value = msg
  loginError.value = true
}

function handleTotp(temporaryToken) {
  return new Promise((res, rej) => {
    resolve = res
    reject = rej
    totpCode.value = ''
    totpToken.value = temporaryToken
    askTotpOpened.value = true
  })
}

function cancelTotp() {
  askTotpOpened.value = false
  reject()
}

async function sendTotp() {
  if (/^[0-9]{6}$/.test(totpCode.value) === false) return
  try {
    const valid = await api.post(
      '/authenticator/verify',
      { code: totpCode.value },
      {
        headers: {
          Authorization: `Bearer ${totpToken.value}`
        }
      }
    )
    if (valid.status) {
      askTotpOpened.value = false
      resolve(valid.token)
    }
  } catch {
    totpError.value = true
    totpCode.value = ''
  }
}

async function validateNewTotp() {
  try {
    const valid = await api.post(
      '/authenticator/validate',
      { code: totpCode.value },
      {
        headers: {
          Authorization: `Bearer ${totpToken.value}`
        }
      }
    )
    proposeTotpOpened.value = false
    resolve()
  } catch {}
}

async function cancelNewTotp() {
  proposeTotpOpened.value = false
  resolve()
}

async function proposeTotp(token: string) {
  return new Promise(async (res, rej) => {
    resolve = res
    reject = rej
    totpCode.value = ''
    totpToken.value = token
    proposeTotpOpened.value = true

    try {
      const qr = await api.post(
        '/authenticator',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      totpQrcode.value = qr.qrcode
    } catch {}
  })
}

async function tryLogin() {
  if (!allowLogin) return

  try {
    const ret = await api.post(`/login`, {
      email: form.email,
      password: form.password
    })
    if (ret.validationRequired) {
      handleError($t('error.validationRequired'))
    } else {
      if (ret.totpNeeded) {
        ret.token = await handleTotp(ret.token)
      } else if (conf.googleAuthenticator && !ret.haveTotp) {
        await proposeTotp(ret.token)
      }
      if (conf.fido2 && canSetupFido()) await proposeFido(ret.token)
      const url = new URL(redirect)
      url.searchParams.set('token', ret.token)
      window.location.href = url.toString()
    }
  } catch {
    handleError($t('error.login'))
  }
}
</script>

<style lang="scss">
.login {
  .alert {
    padding: 12px 20px;
    background: #ffebee;
    color: #a30707;
    border-radius: 4px;
  }

  label {
    font-size: 16px;
    margin: 20px 0 0 0;
    display: block;
  }

  p {
    margin-bottom: 20px;
  }

  input {
    margin-top: 8px;
    font-size: 18px;
    line-height: 1.2;
    color: #686868;
    display: block;
    width: 100%;
    background: #e6e6e6;
    height: 62px;
    border-radius: 3px;
    padding: 0 30px;
    border: none;

    &.biginput {
      font-size: 28px;
      text-align: center;
      font-weight: 700;
    }
  }

  button {
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    line-height: 1.5;
    color: #fff;
    text-transform: uppercase;
    width: 100%;
    height: 62px;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 25px;
    -webkit-transition: all 0.4s;
    -o-transition: all 0.4s;
    -moz-transition: all 0.4s;
    transition: all 0.4s;
    margin-top: 30px;
    border: none;

    &:disabled {
      opacity: 0.5;
    }
  }

  .more {
    margin: 20px 0 0 0;
    font-size: 13px;
  }

  .separator {
    display: flex;
    align-items: center;
    margin: 30px 0;

    .bar {
      height: 1px;
      flex-grow: 1;
      background: #aaa;
    }

    .label {
      flex-shrink: 0;
      color: #aaa;
      font-size: 13px;
      text-transform: uppercase;
      margin: 0 15px;
    }
  }

  img {
    display: block;
    margin: 20px auto;
    width: 200px;
    height: 200px;
  }
}
</style>
