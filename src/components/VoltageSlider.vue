script<template>
    <div v-if="visibility == 'visible' || visibility == 'locked'">
        {{ props.slider.name }}:
        {{ toSiPrefix(minValue, "V", 3) }}
        <input type="range" step="0.01" :min="minValue" :max="maxValue" v-model="value" @pointerdown="onPointerDown" @pointerup="onPointerUp" :class="{ visible: visibility == 'visible', locked: visibility == 'locked'}">
        {{ toSiPrefix(maxValue, "V", 3) }}
        {{ toSiPrefix(props.slider.value, "V", 3) }}
    </div>
</template>

<script setup lang='ts'>
    import { Ref, ref, watch } from 'vue';
    import { HtmlSlider } from '../classes/ctxSlider';
    import { toSiPrefix } from '../functions/toSiPrefix';
    import { eventInitiatesPreciseDragging } from '../functions/eventInitiatesPreciseDragging';
import { Visibility } from '../types';

    const props = defineProps<{
        slider: HtmlSlider,
    }>()

    const minValue: Ref<number> = ref(props.slider.temporaryMinValue)
    const maxValue: Ref<number> = ref(props.slider.temporaryMaxValue)
    const value: Ref<number> = ref(props.slider.value)
    const visibility: Ref<Visibility> = ref(props.slider.visibility)

    watch([() => props.slider.temporaryMinValue, () => props.slider.temporaryMaxValue, () => props.slider.visibility, () => props.slider.updated.value], ([newMinValue, newMaxValue, newVisibility, _]) => {
        minValue.value = newMinValue
        maxValue.value = newMaxValue
        visibility.value = newVisibility
    })

    watch([() => props.slider.value, () => props.slider.fromNode.value.voltage, () => props.slider.toNode.value.voltage], ([sliderValue, _, __]) => {
        value.value = sliderValue
    }, { deep: true })

    watch(value, (newValue: number) => {
        props.slider.value = Number(newValue) // I don't know why, but newValue sometimes get passed as a string
        if (isNaN(props.slider.value)) {
            console.error("Html slider received non-numeric value")
        }
        props.slider.updateNodeVoltagesBasedOnValue()
    })

    const onPointerDown = (event: PointerEvent) => {
        console.log("Pointerdown")
        props.slider.dragging = true
        props.slider.checkDrag({x: 0, y: 0}, eventInitiatesPreciseDragging(event))
        props.slider.value = value.value // even if value.value didn't change
    }

    const onPointerUp = () => {
        props.slider.releaseSlider() // sets props.slider.dragging to false
    }
</script>

<style scoped>
    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        width: 10rem;
    }

    /***** Track Styles *****/
    /***** Chrome, Safari, Opera, and Edge Chromium *****/
    input[type="range"]::-webkit-slider-runnable-track {
        /* background: orange; */
        height: 0.4rem;
    }

    /******** Firefox ********/
    input[type="range"]::-moz-range-track {
        /* background: orange; */
        height: 0.25rem;
    }

    /***** Thumb Styles *****/
    /***** Chrome, Safari, Opera, and Edge Chromium *****/
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        margin-top: -0.2rem; /* Centers thumb on the track */
        /* background-color: #ff0000; */
        height: 0.75rem;
        width: 0.75rem;
        border-radius: 0.5rem;
    }

    /***** When visibility == 'visible' *****/
    input.visible[type="range"]::-webkit-slider-runnable-track {
        background: orange;
    }
    input.visible[type="range"]::-moz-range-track {
        background: orange;
    }
    input.visible[type="range"]::-webkit-slider-thumb {
        background-color: #ff0000;
    }

    /***** When visibility == 'locked' *****/
    input.locked[type="range"]::-webkit-slider-runnable-track {
        background: lightgrey;
    }
    input.locked[type="range"]::-moz-range-track {
        background: lightgrey;
    }
    input.locked[type="range"]::-webkit-slider-thumb {
        background-color: lightgrey;
    }
</style>
