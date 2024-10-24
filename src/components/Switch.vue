<template>
  <div @click="toggle" style="cursor: pointer; display: flex; align-items: center; max-width: 250px; height: 50px; padding: 10px" class="prevent-select">
    <p style="margin-right: 10px; text-align: right;">{{ props.option }}</p>
    <div>
      <div style="display: flex; margin-bottom: -30px; width: 100px;">
        <!-- Indicator line on the left side -->
        <div :style="`width: 15px; border-radius: 2px; margin-top: 26px; background-color: black; height: ${isBoolean ? (props.modelValue ? '3px' : '2px') : (props.modelValue === props.labelUp ? '3px' : '2px')}; margin-left: 34px;`"></div>
        <!-- Label for the current value of modelValue -->
        <p :style="`margin-left: 7px; font-weight: ${isBoolean ? (props.modelValue ? 'bold' : '') : (props.modelValue === props.labelUp ? 'bold' : '')}`">
          {{ props.labelUp }}
        </p>
      </div>
      <div style="display: flex; margin-top: 15px; margin-bottom: 15px;">
        <!-- Vertical separator line -->
        <div style="width: 15px; height: 3px; background-color: black; border-radius: 2px;"></div>
        <!-- Rotatable element indicating the switch position -->
        <div
          :style="`width: 26px; height: 3px; background-color: black; border-radius: 2px; margin-left: -1px; transform: rotate(${isBoolean ? (props.modelValue ? '-33deg' : '33deg') : (props.modelValue === props.labelUp ? '-33deg' : '33deg')}); transform-origin: 0% 50%; transition-duration: 200ms;`">
        </div>
      </div>
      <div style="display: flex; margin-top: -30px; width: 100px;">
        <!-- Indicator line on the right side -->
        <div :style="`width: 15px; border-radius: 2px; margin-top: 26px; background-color: black; height: ${isBoolean ? (props.modelValue ? '2px' : '3px') : (props.modelValue === props.labelUp ? '2px' : '3px')}; margin-left: 34px;`"></div>
        <!-- Label for the other value of modelValue -->
        <p :style="`margin-left: 7px; font-weight: ${isBoolean ? (props.modelValue ? '' : 'bold') : (props.modelValue === props.labelDown ? 'bold' : '')}`">
          {{ props.labelDown }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts' generic="T">
// need more type safety here with the labels being part of the T union if modelValue is not a boolean
type UnionType = T extends string ? T : never

type Props<T> = {
  labelUp: T extends UnionType ? T : never,
  labelDown: T extends UnionType ? T : never,
  option: string,
  modelValue: boolean | T
}

const props = defineProps<Props<T>>()

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
