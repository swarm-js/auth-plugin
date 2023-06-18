<template>
  <div class="confirm">
    <p>{{ $t('emailConfirmed') }}</p>
    <a
      :style="{
        background: conf.themeColor,
        color:
          fontColorContrast(conf.themeColor) === '#000000' ? '#333' : '#fff'
      }"
      :href="conf.prefix + '/login?redirect=' + encodeURIComponent(redirect)"
      >{{ $t('login.button') }}</a
    >
  </div>
</template>

<script setup lang="ts">
import fontColorContrast from 'font-color-contrast'
const { conf } = defineProps({
  conf: {}
})

let query = new URL(window.location).searchParams
let redirect = query.get('redirect')
</script>

<style lang="scss">
.confirm {
  a {
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
    text-decoration: none;

    &:disabled {
      opacity: 0.5;
    }
  }
}
</style>
