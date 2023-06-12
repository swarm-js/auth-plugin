<template>
  <div class="confirm">
    <p>{{ $t('emailNotConfirmed') }}</p>
  </div>
</template>

<script setup lang="ts">
const { conf } = defineProps({
  conf: {}
})
</script>

<style lang="scss">
.confirm {
}
</style>
