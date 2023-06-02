<template>
  <div class="error" v-if="error">
    <h1>{{ $t('error.title') }}</h1>
    <p>{{ errorMsg }}</p>
  </div>
  <div class="login" v-else>
    <h1>{{ $t('login.title') }}</h1>
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
    </form>
    <div class="separator" v-if="displayOr">
      <div class="bar"></div>
      <div class="label">{{ $t('login.or') }}</div>
      <div class="bar"></div>
    </div>
    <SocialButtons :conf="conf" :redirect="redirect" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import fontColorContrast from 'font-color-contrast'
import { reactive, computed } from 'vue'
import SocialButtons from '../components/SocialButtons.vue'

const { t: $t } = useI18n()

const { conf } = defineProps({
  conf: {}
})

let query = new URL(document.location).searchParams
let redirect = query.get('redirect')
let token = query.get('token')
let error = false
let errorMsg = ''

if (!redirect) {
  error = true
  errorMsg = $t('login.errors.noRedirect')
} else if (token) {
  const url = new URL(redirect)
  url.searchParams.set('token', token)
  window.location.href = url.toString()
}

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

async function tryLogin () {
  if (!allowLogin) return
  console.log(form)
}
</script>

<style lang="scss">
.login {
  form {
    label {
      font-size: 16px;
      margin: 20px 0 0 0;
      display: block;
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
}
</style>
