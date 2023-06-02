<template>
  <div class="confirm">
    <h1>{{ $t('confirm.title') }}</h1>
  </div>
</template>

<script setup>
const { conf } = defineProps({
  conf: {}
})
</script>

<style lang="scss">
.confirm {
}
</style>
