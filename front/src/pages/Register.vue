<template>
  <div class="register">
    <h1>{{ $t('register.title') }}</h1>
  </div>
</template>

<script setup lang="ts">
const { conf } = defineProps({
  conf: {}
})
</script>

<style lang="scss">
.register {
}
</style>