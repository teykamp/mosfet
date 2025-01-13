<template>
    <div v-if="visibility == 'visible' || visibility == 'locked'" style="user-select: none; display: flex; align-items: end;" ref="outerDiv">
        <div style="display: inline-block; text-align: right; width: 4rem; padding-right: 10px">
            {{ props.htmlSlider.name }}:
        </div>
        <div style="position: relative; display: inline-block;">

            <!-- Ticks shown during precise dragging -->
            <div v-show="preciseDragging" style="position: absolute; display: flex; justify-content: start; align-items: center; top: 0; transform: translate(1px, 19px);">
                <div v-for="tickDiv in tickDivs" :style="`position: relative; width: ${tickDiv.widthPx}px; height: ${tickDiv.type == 'major' ? '18px' : '12px'}; visibility: ${tickDiv.type == 'spacer' ? 'hidden' : 'visible'}`" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
            </div>

            <!-- Arrow head and tail -->
            <div style="position: relative; display: flex; justify-content: space-between; align-items: center; top: 0;">
                    <div style="position: relative; width: 20px; transform: translate(-5px, 22px) rotate(90deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                <div>
                    <div style="position: relative">
                        <div style="width: 15px; transform: translate(1px, 19px) rotate(65deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                        <div style="width: 15px; transform: translate(1px, 24px) rotate(-65deg);" :class="{sliderBody: true, visible: visibility == 'visible', locked: visibility == 'locked'}"></div>
                    </div>
                </div>
            </div>

            <!-- The slider itself -->
            <input type="range" step="0.01"
                :min="minValue" :max="maxValue" v-model="value"
                @pointerdown="onPointerDown" @pointerup="onPointerUp" @pointermove="onPointerMove"
                :disabled="visibility == 'locked'"
                :class="{ visible: visibility == 'visible', locked: visibility == 'locked'}"
                :style="`position: relative; width: calc(${outerDivWidthPx}px - 4rem - 2rem - 10px - 10px - 1rem)`"
                ref="slider"
            >
        </div>
        <div style="display: inline-block; text-align: right; width: 2rem; padding-left: 10px">
            {{ toSiPrefix(props.htmlSlider.value, "V", 3) }}
        </div>

    </div>
</template>

<script setup lang='ts'>
    import { computed, ComputedRef, onMounted, Ref, ref, watch } from 'vue';
    import { HtmlSlider } from '../classes/ctxSlider';
    import { toSiPrefix } from '../functions/toSiPrefix';
    import { eventInitiatesPreciseDragging } from '../functions/eventInitiatesPreciseDragging';
    import { Visibility } from '../types';
    import { useResizeObserver } from '@vueuse/core'

    type TickDiv = {
        type: 'spacer' | 'major' | 'minor',
        widthPx: number,
    }

    const props = defineProps<{
        htmlSlider: HtmlSlider,
    }>()


    const outerDiv = ref<HTMLInputElement | null>(null) // the template ref
    const outerDivWidthPx: Ref<number> = ref(200)
    useResizeObserver(outerDiv, (entries) => {
        const entry = entries[0]
        outerDivWidthPx.value = entry.contentRect.width
    })

    const slider = ref<HTMLInputElement | null>(null) // the template ref
    const sliderWidthPx: Ref<number> = ref(60)
    useResizeObserver(slider, (entries) => {
        const entry = entries[0]
        sliderWidthPx.value = entry.contentRect.width
    })

    const minValue: Ref<number> = ref(props.htmlSlider.temporaryMinValue)
    const maxValue: Ref<number> = ref(props.htmlSlider.temporaryMaxValue)
    const value: Ref<number> = ref(props.htmlSlider.value)
    const visibility: Ref<Visibility> = ref(props.htmlSlider.visibility)
    const preciseDragging: Ref<boolean> = ref(props.htmlSlider.preciseDragging)
    const tickWidthPx: number = 5

    const tickDivs: ComputedRef<TickDiv[]> = computed(() => {
        const divs: TickDiv[] = []
        let nextTickDivIsSpacer
        let tickValue = Math.ceil(minValue.value * 2) / 2 // smallest multiple of 0.5 above minValue
        let nextTickIsMajor = (tickValue * 2) % 2 == 0

        const standardSpacerWidth = sliderWidthPx.value * 0.5 / (maxValue.value - minValue.value) - tickWidthPx / 2 * 2

        const firstSpacerWidthPx = sliderWidthPx.value * (tickValue - minValue.value) / (maxValue.value - minValue.value) - tickWidthPx / 2

        if (firstSpacerWidthPx >= 0) {
            divs.push({
                type: 'spacer',
                widthPx: firstSpacerWidthPx,
            })
            nextTickDivIsSpacer = false
        } else {
            divs.push({
                type: nextTickIsMajor ? 'major' : 'minor',
                widthPx: tickWidthPx + firstSpacerWidthPx, // firstSpacerWidthPx is negative
            })
            nextTickIsMajor = !nextTickIsMajor
            nextTickDivIsSpacer = true
        }

        let cumulativeDivWidthPx = divs[0].widthPx

        while (cumulativeDivWidthPx < sliderWidthPx.value) {
            if (nextTickDivIsSpacer) {
                    divs.push({
                        type: 'spacer',
                        widthPx: standardSpacerWidth,
                    })
                } else {
                divs.push({
                    type: nextTickIsMajor ? 'major' : 'minor',
                    widthPx: tickWidthPx,
                })
                nextTickIsMajor = !nextTickIsMajor
            }
            cumulativeDivWidthPx += divs[divs.length - 1].widthPx
            nextTickDivIsSpacer = !nextTickDivIsSpacer
        }

        // undo the last iteration of the while loop
        cumulativeDivWidthPx -= divs[divs.length - 1].widthPx
        divs.pop()
        nextTickDivIsSpacer = !nextTickDivIsSpacer
        if (!nextTickDivIsSpacer) {
            nextTickIsMajor = !nextTickIsMajor
        }

        const lastSpacerWidthPx = sliderWidthPx.value - cumulativeDivWidthPx

        if (nextTickDivIsSpacer) {
                divs.push({
                    type: 'spacer',
                    widthPx: lastSpacerWidthPx,
                })
                } else {
                divs.push({
                    type: nextTickIsMajor ? 'major' : 'minor',
                    widthPx: lastSpacerWidthPx,
                })
            }

        return divs
    })

    watch([() => props.htmlSlider.value, () => props.htmlSlider.temporaryMinValue, () => props.htmlSlider.temporaryMaxValue, () => props.htmlSlider.visibility, () => props.htmlSlider.preciseDragging, () => props.htmlSlider.updated.value], ([newValue, newMinValue, newMaxValue, newVisibility, newPreciseDragging, _]) => {
        value.value = newValue
        minValue.value = newMinValue
        maxValue.value = newMaxValue
        visibility.value = newVisibility
        preciseDragging.value = newPreciseDragging
    })

    watch([() => props.htmlSlider.value, () => props.htmlSlider.fromNode.value.voltage, () => props.htmlSlider.toNode.value.voltage], ([sliderValue, _, __]) => {
        value.value = sliderValue
    }, { deep: true })

    watch(value, (newValue: number) => {
        props.htmlSlider.value = Number(newValue) // I don't know why, but newValue sometimes get passed as a string
        if (isNaN(props.htmlSlider.value)) {
            console.error("Html slider received non-numeric value")
        }
        props.htmlSlider.updateNodeVoltagesBasedOnValue()
    })

    watch(props.htmlSlider.selected, () => {
        if (props.htmlSlider.selected.value && props.htmlSlider.selectionChanged.value) {
            props.htmlSlider.selectionChanged.value = false
            if (slider.value) {
                console.log("focusing on slider")
                slider.value.focus()
            }
        }
    })

    const onPointerDown = (event: PointerEvent) => {
        props.htmlSlider.dragging = true
        props.htmlSlider.selected.value = true
        props.htmlSlider.checkDrag({x: 0, y: 0}, eventInitiatesPreciseDragging(event))
        props.htmlSlider.value = value.value // even if value.value didn't change
    }

    const onPointerMove = (event: PointerEvent) => {
        props.htmlSlider.dragSlider(event)
    }

    const onPointerUp = () => {
        props.htmlSlider.releaseSlider() // sets props.htmlSlider.dragging to false
    }

    onMounted(() => {
        props.htmlSlider.react()
    })

</script>

<style scoped>

    .sliderBody.visible {
        background: orange;
        height: 6.4px;
    }

    .sliderBody.locked {
        background: lightgrey;
        height: 6.4px;
    }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        /* width: 10rem; */
        border-style: none;
    }

    /***** Track Styles *****/
    /***** Chrome, Safari, Opera, and Edge Chromium *****/
    input[type="range"]::-webkit-slider-runnable-track {
        /* background: orange; */
        height: 6.4px;
        border-style: none;
    }

    /******** Firefox ********/
    input[type="range"]::-moz-range-track {
        /* background: orange; */
        height: 6.4px;
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
