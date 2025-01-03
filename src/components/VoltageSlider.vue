script<template>
    <div>
        {{ props.slider.name }}:
        <!-- {{ props.slider.temporaryMinValue }}
        {{ minValue }} -->
        <input type="range" step="0.01" :min="minValue" :max="maxValue" v-model="value" @pointerdown="onPointerDown" @pointerup="onPointerUp">
        <!-- {{ maxValue }} -->
        <!-- {{ props.slider.temporaryMaxValue }} -->
        <!-- {{ value }} -->
        {{ toSiPrefix(props.slider.value, "V", 3) }}
        {{ props.slider.dragging }}
    </div>
</template>

<script setup lang='ts'>
    import { Ref, ref, watch } from 'vue';
import { HtmlSlider } from '../classes/ctxSlider';
import { toSiPrefix } from '../functions/toSiPrefix';

    const props = defineProps<{
        slider: HtmlSlider,
    }>()

    const minValue: Ref<number> = ref(props.slider.temporaryMinValue)
    const maxValue: Ref<number> = ref(props.slider.temporaryMaxValue)
    const value: Ref<number> = ref(props.slider.value)

    // watch([() => props.slider.temporaryMinValue, () => props.slider.temporaryMaxValue, () => props.slider.value], ([sliderMinValue, sliderMaxValue, sliderValue]) => {
    //     console.log("Watch #1")
    //     minValue.value = sliderMinValue
    //     maxValue.value = sliderMaxValue
    //     value.value = sliderValue
    // })

    watch([() => props.slider.value, () => props.slider.fromNode.value.voltage, () => props.slider.toNode.value.voltage], ([sliderValue, _, __]) => {
        console.log("Watch #1: ", sliderValue)
        console.log(props.slider.fromNode.value.voltage, " --> ", props.slider.toNode.value.voltage)
        value.value = sliderValue
    }, { deep: true })

    watch(value, (newValue: number) => {
        // console.log("Watch #2")
        props.slider.value = Number(newValue) // I don't know why, but newValue sometimes get passed as a string
        if (isNaN(props.slider.value)) {
            console.error("Html slider received non-numeric value")
        }
        console.log("newValue is ", newValue, ": ", typeof(newValue))
        props.slider.updateNodeVoltagesBasedOnValue()
    })

    const onPointerDown = () => {
        props.slider.dragging = true
        props.slider.value = value.value // even if value.value didn't change
        console.log("html slider value: ", props.slider.value)
    }

    const onPointerUp = () => {
        props.slider.releaseSlider() // sets props.slider.dragging to false
        console.log("html slider value: ", props.slider.value)
    }
</script>
