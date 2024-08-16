<template>
  <div @click="toggle" style="cursor: pointer; display: flex; align-items: center; max-width: 250px;" class="prevent-select">
    <p style="margin-right: 10px;">{{ props.option }}</p>
    <div>
      <div style="display: flex; margin-bottom: -30px;">
        <!-- Indicator line on the left side -->
        <div style="width: 10px; height: 0; margin-top: 28px; border: 1px solid black; margin-left: 38px;"></div>
        <!-- Label for the current value of modelValue -->
        <p :style="`margin-left: 10px; font-weight: ${isBoolean ? (props.modelValue ? 'bold' : '') : (props.modelValue === props.labelUp ? 'bold' : '')}`">
          {{ props.labelUp }}
        </p>
      </div>
      <div style="margin-top: 20px; margin-bottom: 20px; display: flex;">
        <!-- Vertical separator line -->
        <div style="width: 10px; border: 1px solid black;"></div>
        <!-- Rotatable element indicating the switch position -->
        <div
          :style="`width: 30px; border: 1px solid black; transform: rotate(${isBoolean ? (props.modelValue ? '-35deg' : '35deg') : (props.modelValue === props.labelUp ? '-35deg' : '35deg')}); transform-origin: 0% 50%; transition-duration: 200ms;`">
        </div>
      </div>
      <div style="display: flex; margin-top: -30px;">
        <!-- Indicator line on the right side -->
        <div style="width: 10px; height: 0; margin-top: 26px; border: 1px solid black; margin-left: 38px;"></div>
        <!-- Label for the other value of modelValue -->
        <p :style="`margin-left: 10px; font-weight: ${isBoolean ? (props.modelValue ? '' : 'bold') : (props.modelValue === props.labelDown ? 'bold' : '')}`">
          {{ props.labelDown }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts' generic="T extends string">
// need more type safety here with the labels being part of the T union if modelValue is not a boolean
const props = defineProps<{ 
  labelUp: string,
  labelDown: string,
  option: string,
  modelValue: boolean | T,
}>()

const isBoolean = typeof props.modelValue === 'boolean'


const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean | T): void
}>()

const toggle = () => {
  if (isBoolean) emit('update:modelValue', !props.modelValue)
  else {
    const newValue = props.modelValue === props.labelUp ? props.labelDown : props.labelUp
    emit('update:modelValue', newValue as T)
  }
}
</script>

<style scoped>
.prevent-select {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>