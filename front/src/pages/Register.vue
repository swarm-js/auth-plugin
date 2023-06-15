<template>
  <div class="loading" v-if="loading">
    <Loader :color="conf.themeColor" />
  </div>
  <div class="error" v-else-if="error">
    <h1>{{ $t('error.title') }}</h1>
    <p>{{ errorMsg }}</p>
  </div>
  <div class="error" v-else-if="validationRequired">
    <h1>{{ $t('register.validationRequired.title') }}</h1>
    <p>{{ $t('register.validationRequired.desc') }}</p>
  </div>
  <div class="register" v-else>
    <h1>{{ $t('register.title') }}</h1>

    <div class="alert" v-if="registerError">{{ registerErrorMessage }}</div>

    <form @submit.native.prevent="tryregister" v-if="conf.password">
      <label>
        {{ $t('register.email') }}
        <input type="email" v-model="form.email" />
      </label>
      <label>
        {{ $t('register.password') }}
        <input type="password" v-model="form.password" />
      </label>
      <label>
        {{ $t('register.passwordConfirm') }}
        <input
          type="password"
          v-model="form.passwordConfirm"
          @keyup.enter="tryregister"
        />
      </label>
      <button
        :disabled="!allowregister"
        :style="{
          background: conf.themeColor,
          color:
            fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
        }"
      >
        {{ $t('register.button') }}
      </button>
      <div class="more">
        {{ $t('register.loginPrompt') }}
        <a
          :href="
            conf.prefix + '/login?redirect=' + encodeURIComponent(redirect)
          "
        >
          {{ $t('register.loginButton') }}
        </a>
      </div>
    </form>
    <div class="separator" v-if="displayOr">
      <div class="bar"></div>
      <div class="label">{{ $t('register.or') }}</div>
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

const { t: $t } = useI18n()

const props = defineProps({
  conf: {}
})
const conf: any = props.conf

const api = useApi(conf.prefix)

let query = new URL(document.location).searchParams
let redirect = query.get('redirect')
let token = query.get('token')
let error = false
let errorMsg = ''
let registerError = ref(false)
let registerErrorMessage = ref('')
let loading = ref(true)
let validationRequired = ref(false)

if (!redirect) {
  error = true
  errorMsg = $t('register.errors.noRedirect')
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
    error = true
    errorMsg = $t('register.errors.nonAllowedRedirect')
  }
}

loading.value = false

const form = reactive({ email: '', password: '', passwordConfirm: '' })
const displayOr =
  conf.password && (conf.facebook || conf.google || conf.ethereum)

const allowregister = computed(_ => {
  return (
    form.email.length &&
    form.email.match(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm) &&
    form.password.length >= 6 &&
    form.password === form.passwordConfirm
  )
})

function handleError(msg: string) {
  registerErrorMessage.value = msg
  registerError.value = true
}

async function tryregister() {
  if (!allowregister) return

  try {
    const ret = await api.post(`/register`, {
      email: form.email,
      password: form.password,
      redirect
    })
    if (ret.validationRequired) {
      validationRequired.value = true
    } else {
      const url = new URL(redirect)
      url.searchParams.set('token', ret.token)
      window.location.href = url.toString()
    }
  } catch {
    handleError($t('error.register'))
  }
}
</script>

<style lang="scss">
.register {
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
