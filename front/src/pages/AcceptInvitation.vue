<template>
  <div class="loading" v-if="loading">
    <Loader :color="conf.themeColor" />
  </div>
  <div class="error" v-else-if="error">
    <h1>{{ $t('error.title') }}</h1>
    <p>{{ errorMsg }}</p>
  </div>
  <div class="acceptInvitation" v-else>
    <h1>{{ $t('acceptInvitation.title') }}</h1>
    <p>{{ $t('acceptInvitation.desc') }}</p>

    <div class="alert" v-if="acceptInvitationError">
      {{ acceptInvitationErrorMessage }}
    </div>

    <form @submit.native.prevent="tryacceptInvitation">
      <label>
        {{ $t('acceptInvitation.password') }}
        <input type="password" v-model="form.password" />
      </label>
      <label>
        {{ $t('acceptInvitation.passwordConfirm') }}
        <input
          type="password"
          v-model="form.passwordConfirm"
          @keyup.enter="tryacceptInvitation"
        />
      </label>
      <button
        :disabled="!allowacceptInvitation"
        :style="{
          background: conf.themeColor,
          color:
            fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
        }"
      >
        {{ $t('acceptInvitation.button') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import fontColorContrast from 'font-color-contrast'
import { reactive, computed, ref } from 'vue'
import Loader from '../components/Loader.vue'
import { useApi } from '../composables/useApi'

const { t: $t } = useI18n()

const props = defineProps({
  conf: {}
})
const conf: any = props.conf

const api = useApi(conf.prefix)

let query = new URL(window.location).searchParams
let redirect = query.get('redirect')
let code = query.get('code')
let error = false
let errorMsg = ''
let acceptInvitationError = ref(false)
let acceptInvitationErrorMessage = ref('')
let loading = ref(true)

if (!redirect) {
  error = true
  errorMsg = $t('acceptInvitation.errors.noRedirect')
} else if (!code) {
  error = true
  errorMsg = $t('acceptInvitation.errors.noCode')
} else {
  try {
    const domain = new URL(redirect).host
    if (
      (conf.allowedDomains ?? []).length &&
      (conf.allowedDomains ?? []).includes(domain) === false
    )
      throw new Error('Domain not allowed')
  } catch (err) {
    error = true
    errorMsg = $t('acceptInvitation.errors.nonAllowedRedirect')
  }
}

loading.value = false

const form = reactive({ password: '', passwordConfirm: '' })

const allowacceptInvitation = computed(_ => {
  return form.password.length >= 6 && form.password === form.passwordConfirm
})

function handleError(msg: string) {
  acceptInvitationErrorMessage.value = msg
  acceptInvitationError.value = true
}

async function tryacceptInvitation() {
  if (!allowacceptInvitation) return

  try {
    const ret = await api.post(`/accept-invitation`, {
      code,
      password: form.password,
      redirect
    })
    const url = new URL(redirect)
    url.searchParams.set('token', ret.token)
    window.location.href = url.toString()
  } catch {
    handleError($t('error.acceptInvitation'))
  }
}
</script>

<style lang="scss">
.acceptInvitation {
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
