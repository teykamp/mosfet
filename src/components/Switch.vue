<template>
  <div @click="toggle" style="cursor: pointer;">
    <div style="display: flex; margin-bottom: -30px;">
      <div style="width: 10px; height: 0; margin-top: 28px; border: 1px solid black; margin-left: 38px;"></div>
      <p>{{ props.labelUp }}</p>
    </div>
    <div style="margin-top: 20px;  margin-bottom: 20px; display: flex;">
      <div style="width: 10px; border: 1px solid black;"></div>
      <div
        :style="`width: 30px; border: 1px solid black; transform: rotate(${props.modelValue ? '35deg' : '-35deg'}); transform-origin: 0% 50%`">
      </div>
    </div>
    <div style="display: flex; margin-top: -30px;">
      <div style="width: 10px; height: 0; margin-top: 26px; border: 1px solid black; margin-left: 38px;"></div>
      <p>{{ props.labelDown }}</p>
    </div>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps<{ 
  modelValue: boolean,
  labelUp: string,
  labelDown: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>

</style>