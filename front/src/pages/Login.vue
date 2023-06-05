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
    <input v-model="totpCode" class="biginput" maxlength="6" />
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
    <input v-model="totpCode" class="biginput" maxlength="6" />
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
        <input type="password" v-model="form.password" />
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
        {{ $t('login.forgotPrompt') }}
        <a
          :href="
            conf.prefix +
            '/forgot-password?redirect=' +
            encodeURIComponent(redirect)
          "
          >{{ $t('login.forgotButton') }}</a
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

<script setup>
import { useI18n } from 'vue-i18n'
import fontColorContrast from 'font-color-contrast'
import { reactive, computed, ref } from 'vue'
import SocialButtons from '../components/SocialButtons.vue'
import Loader from '../components/Loader.vue'
import { useApi } from '../composables/useApi'

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
let proposeTotpOpened = ref(true)
let totpCode = ref('')
let totpError = ref(false)
let totpToken = ref('')
let totpQrcode = ref('')
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
    }
  } catch (err) {
    console.log(err.message)
    error = true
    errorMsg = $t('login.errors.nonAllowedRedirect')
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

function handleError (msg) {
  loginErrorMessage.value = msg
  loginError.value = true
}

function handleTotp (temporaryToken) {
  return new Promise((res, rej) => {
    resolve = res
    reject = rej
    totpCode.value = ''
    totpToken.value = temporaryToken
    askTotpOpened.value = true
  })
}

function cancelTotp () {
  askTotpOpened.value = false
  reject()
}

async function sendTotp () {
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

async function validateNewTotp () {
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

async function cancelNewTotp () {
  proposeTotpOpened.value = false
  resolve()
}

async function proposeTotp (token) {
  return new Promise(async (res, rej) => {
    resolve = res
    reject = rej
    totpCode.value = ''
    totpToken.value = temporaryToken
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

async function tryLogin () {
  if (!allowLogin) return

  try {
    const ret = await api.post(`/login`, {
      email: form.email,
      password: form.password
    })
    if (ret.validationRequired) {
      handleError($t('error.validationRequired'))
    } else if (ret.totpNeeded) {
      ret.token = await handleTotp(ret.token)
    } else if (conf.googleAuthenticator && !ret.haveTotp) {
      await proposeTotp(ret.token)
    } else {
      const url = new URL(redirect)
      url.searchParams.set('token', token)
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
