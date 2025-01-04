script<template>
    <div v-if="visibility == 'visible' || visibility == 'locked'" style="user-select: none;">
        {{ props.slider.name }}:
        {{ toSiPrefix(minValue, "V", 3) }}
        <div style="position: relative; display: inline-block;">
            <div style="position: relative; display: flex; justify-content: space-between; align-items: center; top: 0;">
                    <div style="position: relative; width: 20px; transform: translate(-5px, 22px) rotate(90deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                <div>
                    <div style="position: relative">
                        <div style="width: 15px; transform: translate(1px, 19px) rotate(65deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                        <div style="width: 15px; transform: translate(1px, 24px) rotate(-65deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                    </div>
                </div>
            </div>
            <input type="range" step="0.01" :min="minValue" :max="maxValue" v-model="value" @pointerdown="onPointerDown" @pointerup="onPointerUp" :class="{ visible: visibility == 'visible', locked: visibility == 'locked'}" style="position: relative">
        </div>
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

    .sliderBody.visible {
        background: orange;
        height: 0.4rem;
    }

    .sliderBody.locked {
        background: lightgrey;
        height: 0.4rem;
    }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        width: 10rem;
        border-style: none;
    }

    /***** Track Styles *****/
    /***** Chrome, Safari, Opera, and Edge Chromium *****/
    input[type="range"]::-webkit-slider-runnable-track {
        /* background: orange; */
        height: 0.4rem;
        border-style: none;
    }

    /******** Firefox ********/
    input[type="range"]::-moz-range-track {
        /* background: orange; */
        height: 0.4rem;
        transform: translate(0px, 4px);
        border-style: none;
    }

    /***** Thumb Styles *****/
    /***** Chrome, Safari, Opera, and Edge Chromium *****/
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        margin-top: -0.2rem; /* Centers thumb on the track */
        height: 0.75rem;
        width: 0.75rem;
        border-radius: 0.5rem;
        border-style: none;
        z-index: 2;
    }

    /******** Firefox ********/
    input[type="range"]::-moz-range-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        margin-top: -0.2rem; /* Centers thumb on the track */
        height: 0.75rem;
        width: 0.75rem;
        border-radius: 0.5rem;
        border-style: none;
        z-index: 2;
        transform: translate(0px, 4px);
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
    input.visible[type="range"]::-moz-range-thumb {
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
    input.locked[type="range"]::-moz-range-thumb {
        background-color: lightgrey;
    }
</style>
