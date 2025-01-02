<template>
    <div>
        {{ props.slider.name }}:
        <!-- {{ props.slider.temporaryMinValue }}
        {{ minValue }} -->
        <input type="range" step="0.01" :min="minValue" :max="maxValue" v-model="value" @pointerdown="onPointerDown" @pointerup="onPointerUp">
        <!-- {{ maxValue }} -->
        <!-- {{ props.slider.temporaryMaxValue }} -->
        {{ value }}
        {{ props.slider.value }}
        {{ props.slider.dragging }}
    </div>
</template>

<script setup lang='ts'>
    import { ref, watch } from 'vue';
import { HtmlSlider } from '../classes/ctxSlider';

    const props = defineProps<{
        slider: HtmlSlider,
    }>()

    const minValue = ref(props.slider.temporaryMinValue)
    const maxValue = ref(props.slider.temporaryMaxValue)
    const value = ref(props.slider.value)

    // watch([() => props.slider.temporaryMinValue, () => props.slider.temporaryMaxValue, () => props.slider.value], ([sliderMinValue, sliderMaxValue, sliderValue]) => {
    //     console.log("Watch #1")
    //     minValue.value = sliderMinValue
    //     maxValue.value = sliderMaxValue
    //     value.value = sliderValue
    // })

    watch([() => props.slider.value, () => props.slider.fromNode.value.voltage, () => props.slider.toNode.value.voltage], ([sliderValue, _, __]) => {
        console.log("Watch #1")
        value.value = sliderValue
    }, { deep: true })

    watch(value, (newValue) => {
        console.log("Watch #2")
        props.slider.value = newValue
        props.slider.updateNodeVoltagesBasedOnValue()
    })

    watch(() => props.slider.dragging, () => {
        console.log("Watch #3")
    }, { deep: true })

    const onPointerDown = () => {
        console.log("pointer down")
        props.slider.dragging = true
        props.slider.value = value.value // even if value.value didn't change
        console.log(props.slider.dragging)
    }

    const onPointerUp = () => {
        console.log("pointer up")
        props.slider.releaseSlider()
        console.log(props.slider.dragging)
    }
</script>
