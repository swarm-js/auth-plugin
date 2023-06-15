<template>
  <div class="loading" v-if="loading">
    <Loader :color="conf.themeColor" />
  </div>
  <div class="error" v-else-if="error">
    <h1>{{ $t('error.title') }}</h1>
    <p>{{ errorMsg }}</p>
  </div>
  <div class="error" v-else-if="confirm">
    <h1>{{ $t('magiclink.confirm.title') }}</h1>
    <p>{{ $t('magiclink.confirm.desc') }}</p>
  </div>
  <div class="magiclink" v-else>
    <h1>{{ $t('magiclink.title') }}</h1>
    <p>{{ $t('magiclink.desc') }}</p>

    <div class="alert" v-if="magiclinkError">{{ magiclinkErrorMessage }}</div>

    <form @submit.native.prevent="trymagiclink" v-if="conf.password">
      <label>
        {{ $t('magiclink.email') }}
        <input type="email" v-model="form.email" @keyup.enter="trymagiclink" />
      </label>
      <button
        :disabled="!allowmagiclink"
        :style="{
          background: conf.themeColor,
          color:
            fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
        }"
      >
        {{ $t('magiclink.button') }}
      </button>
      <div class="more">
        <a
          :href="
            conf.prefix + '/login?redirect=' + encodeURIComponent(redirect)
          "
        >
          {{ $t('magiclink.back') }}
        </a>
      </div>
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

let query = new URL(document.location).searchParams
let redirect = query.get('redirect')
let error = false
let errorMsg = ''
let magiclinkError = ref(false)
let magiclinkErrorMessage = ref('')
let loading = ref(true)
let confirm = ref(false)

if (!redirect) {
  error = true
  errorMsg = $t('magiclink.errors.noRedirect')
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
    errorMsg = $t('magiclink.errors.nonAllowedRedirect')
  }
}

loading.value = false

const form = reactive({ email: '' })

const allowmagiclink = computed(_ => {
  return (
    form.email.length &&
    form.email.match(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm)
  )
})

function handleError(msg: string) {
  magiclinkErrorMessage.value = msg
  magiclinkError.value = true
}

async function trymagiclink() {
  if (!allowmagiclink) return

  try {
    const ret = await api.post(`/magic-link`, {
      email: form.email,
      redirect
    })
    confirm.value = true
  } catch {
    handleError($t('error.magiclink'))
  }
}
</script>

<style lang="scss">
.magiclink {
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
    text-align: center;
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
