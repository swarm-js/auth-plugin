<template>
  <button
    @click="loginWithFacebook"
    class="socialButton facebook"
    v-if="conf.facebook"
  >
    <span>Facebook</span>
    <span class="icon">
      <svg
        height="512px"
        id="Layer_1"
        style="enable-background: new 0 0 512 512"
        version="1.1"
        viewBox="0 0 512 512"
        width="512px"
        xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <path
          d="M288,192v-38.1c0-17.2,3.8-25.9,30.5-25.9H352V64h-55.9c-68.5,0-91.1,31.4-91.1,85.3V192h-45v64h45v192h83V256h56.4l7.6-64  H288z"
          fill="#fff"
        />
      </svg>
    </span>
  </button>
  <button
    @click="loginWithGoogle"
    class="socialButton google"
    v-if="conf.google"
  >
    <span>Google</span>
    <span class="icon">
      <svg
        height="56.6934px"
        id="Layer_1"
        style="enable-background: new 0 0 56.6934 56.6934"
        version="1.1"
        viewBox="0 0 56.6934 56.6934"
        width="56.6934px"
        xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <path
          d="M51.981,24.4812c-7.7173-0.0038-15.4346-0.0019-23.1518-0.001c0.001,3.2009-0.0038,6.4018,0.0019,9.6017  c4.4693-0.001,8.9386-0.0019,13.407,0c-0.5179,3.0673-2.3408,5.8723-4.9258,7.5991c-1.625,1.0926-3.492,1.8018-5.4168,2.139  c-1.9372,0.3306-3.9389,0.3729-5.8713-0.0183c-1.9651-0.3921-3.8409-1.2108-5.4773-2.3649  c-2.6166-1.8383-4.6135-4.5279-5.6388-7.5549c-1.0484-3.0788-1.0561-6.5046,0.0048-9.5805  c0.7361-2.1679,1.9613-4.1705,3.5708-5.8002c1.9853-2.0324,4.5664-3.4853,7.3473-4.0811c2.3812-0.5083,4.8921-0.4113,7.2234,0.294  c1.9815,0.6016,3.8082,1.6874,5.3044,3.1163c1.5125-1.5039,3.0173-3.0164,4.527-4.5231c0.7918-0.811,1.624-1.5865,2.3908-2.4196  c-2.2928-2.1218-4.9805-3.8274-7.9172-4.9056C32.0723,4.0363,26.1097,3.995,20.7871,5.8372  C14.7889,7.8907,9.6815,12.3763,6.8497,18.0459c-0.9859,1.9536-1.7057,4.0388-2.1381,6.1836  C3.6238,29.5732,4.382,35.2707,6.8468,40.1378c1.6019,3.1768,3.8985,6.001,6.6843,8.215c2.6282,2.0958,5.6916,3.6439,8.9396,4.5078  c4.0984,1.0993,8.461,1.0743,12.5864,0.1355c3.7284-0.8581,7.256-2.6397,10.0725-5.24c2.977-2.7358,5.1006-6.3403,6.2249-10.2138  C52.5807,33.3171,52.7498,28.8064,51.981,24.4812z"
          fill="#fff"
        />
      </svg>
    </span>
  </button>
  <button
    @click="loginWithLinkedin"
    class="socialButton linkedin"
    v-if="conf.linkedin"
  >
    <span>Linkedin</span>
    <span class="icon">
      <svg
        height="100%"
        style="
          fill-rule: evenodd;
          clip-rule: evenodd;
          stroke-linejoin: round;
          stroke-miterlimit: 2;
        "
        version="1.1"
        viewBox="0 0 512 512"
        width="100%"
        xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:serif="http://www.serif.com/"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <g id="g5891">
          <g id="shapes">
            <rect
              height="257.962"
              id="rect11"
              style="fill: #fff"
              width="85.76"
              x="61.053"
              y="178.667"
            />
            <path
              d="M104.512,54.28c-29.341,0 -48.512,19.29 -48.512,44.573c0,24.752 18.588,44.574 47.377,44.574l0.554,0c29.903,0 48.516,-19.822 48.516,-44.574c-0.555,-25.283 -18.611,-44.573 -47.935,-44.573Z"
              id="path13-0"
              style="fill: #fff; fill-rule: nonzero"
            />
            <path
              d="M357.278,172.601c-45.49,0 -65.866,25.017 -77.276,42.589l0,-36.523l-85.738,0c1.137,24.197 0,257.961 0,257.961l85.737,0l0,-144.064c0,-7.711 0.554,-15.42 2.827,-20.931c6.188,-15.4 20.305,-31.352 43.993,-31.352c31.012,0 43.436,23.664 43.436,58.327l0,138.02l85.741,0l0,-147.93c0,-79.237 -42.305,-116.097 -98.72,-116.097Z"
              id="path15"
              style="fill: #fff; fill-rule: nonzero"
            />
          </g>
        </g>
      </svg>
    </span>
  </button>
  <button
    @click="loginWithEthereum"
    class="socialButton ethereum"
    v-if="conf.ethereum"
  >
    <span>{{ $t('login.ethereumWallet') }}</span>
    <span class="icon">
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title />
        <path
          fill="#fff"
          d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
        />
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
declare global {
  interface Window {
    ethereum: any
  }
}

import { useI18n } from 'vue-i18n'
import { useApi } from '../composables/useApi'

const { t: $t } = useI18n()
const emit = defineEmits(['error'])

const props: any = defineProps({
  redirect: String,
  conf: {}
})

const redirect: string = props.redirect
const conf: any = props.conf

const api = useApi(conf.prefix)

function loginWithFacebook() {
  window.location.href = `${
    conf.prefix
  }/social/facebook?redirect=${encodeURIComponent(redirect)}`
}

function loginWithGoogle() {
  window.location.href = `${
    conf.prefix
  }/social/google?redirect=${encodeURIComponent(redirect)}`
}

function loginWithLinkedin() {
  window.location.href = `${
    conf.prefix
  }/social/linkedin?redirect=${encodeURIComponent(redirect)}`
}

async function loginWithEthereum() {
  try {
    if (window.ethereum === null) emit('error', $t('error.ethereum'))

    // Connect wallet
    const addresses = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    // Sign message
    const { nonce, requestId } = await api.get('/ethereum/nonce')
    const walletResp = await window.ethereum.request({
      method: 'personal_sign',
      params: [
        `Please log in to ${conf.rpName}.

Nonce: ${nonce}
Request ID : ${requestId}`,
        addresses[0],
        ''
      ]
    })

    // Get JWT
    const {
      token,
      error: err,
      message: errMsg
    } = await api.post('/ethereum/verify', {
      signature: walletResp,
      address: addresses[0],
      requestId
    })

    if (err) {
      emit('error', errMsg)
    } else {
      const url = new URL(redirect)
      url.searchParams.set('token', token)
      window.location.href = url.toString()
    }
  } catch {
    emit('error', $t('error.ethereum'))
  }
}
</script>

<style lang="scss">
.socialButton {
  display: block;
  cursor: pointer;
  width: 100%;
  margin: 20px 0 0 0;
  height: 62px;
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 25px;
  border: none;
  position: relative;
  font-size: 16px;

  span {
    font-weight: 700;
  }

  .icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 62px;
    height: 62px;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      height: 32px;
      width: 32px;
    }
  }

  &.facebook {
    background: #3b5897;
    color: #fff;
  }

  &.google {
    background: #ea4435;
    color: #fff;
  }

  &.ethereum {
    background: #131313;
    color: #fff;
  }

  &.linkedin {
    background: #2867b2;
    color: #fff;
  }
}
</style>
