<template>
  <div @click="toggle" style="cursor: pointer; display: flex; align-items: center; max-width: 250px;" class="prevent-select">
    <p style="margin-right: 10px;">{{ props.option }}</p>
    <div>
      <div style="display: flex; margin-bottom: -30px;">
        <div style="width: 10px; height: 0; margin-top: 28px; border: 1px solid black; margin-left: 38px;"></div>
        <p :style="`margin-left: 10px; font-weight: ${modelValue ? 'bold' : ''}`">{{ props.labelUp }}</p>
      </div>
      <div style="margin-top: 20px;  margin-bottom: 20px; display: flex;">
        <div style="width: 10px; border: 1px solid black;"></div>
        <div
          :style="`width: 30px; border: 1px solid black; transform: rotate(${props.modelValue ? '-35deg' : '35deg'}); transform-origin: 0% 50%; transition-duration: 200ms;`">
        </div>
      </div>
      <div style="display: flex; margin-top: -30px;">
        <div style="width: 10px; height: 0; margin-top: 26px; border: 1px solid black; margin-left: 38px;"></div>
        <p :style="`margin-left: 10px; font-weight: ${modelValue ? '' : 'bold'}`">{{ props.labelDown }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps<{ 
  labelUp: string,
  labelDown: string,
  option: string,
  modelValue: boolean,
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.prevent-select {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>