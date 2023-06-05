<template>
  <div class="forgot">
    <h1>{{ $t('forgot.title') }}</h1>
  </div>
</template>

<script setup>
const { conf } = defineProps({
  conf: {}
})
</script>

<style lang="scss">
.forgot {
}
</style>
