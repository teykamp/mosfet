script<template>
    <div style="position: absolute; top: 10px; left: 100px;">
        <div v-for="sliderGroup in htmlSliders"
            :style="`border: 1px solid black; width: ${widthPx}px`"
            :tabindex="1" :class="{selected: sliderGroup.deviceSelected.value}"
            @focus="setDeviceSelected(sliderGroup, true)"
            :ref="(element) => {
                if (element && sliderGroup.deviceSelected.value) { // element may be null on the first iteration because it is not mounted yet.

                    // Only trigger this ref when deviceSelected changes (as opposed to the default :ref behavior which triggers whenever any property changes, for example the voltages on the htmlSliders).
                    // There is a watch() function on sliderGroup.selectionChanged, initialized inside the Device constructor, which sets selectionChanged.value to true whenever deviceSelected changes value.
                    if (sliderGroup.selectionChanged.value) {
                        sliderGroup.selectionChanged.value = false

                        // A little bit of type checking to see if element.focus() exists and is a function
                        // This is mainly needed to make VS Code happy
                        if ('focus' in element) {
                            (element.focus as Function)()
                        }
                        // or simply element.focus() without the type checking
                    }
                }
        }">
            <div style="display: flex; justify-content: center;">
                {{ sliderGroup.name }}
            </div>
            <VoltageSlider v-for="slider in sliderGroup.value" :slider="slider" :slider-width-px="widthPx - 150"></VoltageSlider>
        </div>
    </div>
</template>

<script setup lang='ts'>
    import { HtmlSlider } from '../classes/ctxSlider'
    import { Named } from '../types'
    import VoltageSlider from './VoltageSlider.vue'

    const props = defineProps<{
        htmlSliders: Named<HtmlSlider[]>[]
        widthPx: number
    }>()

    const setDeviceSelected = (sliderGroup: Named<HtmlSlider[]>, focused: boolean) => {
        console.log("setting device selected")
        if (focused) {
            props.htmlSliders.forEach((otherSliderGroup: Named<HtmlSlider[]>) => {
                otherSliderGroup.deviceSelected.value = false
            })
        }
        sliderGroup.deviceSelected.value = focused
    }
</script>

<style scoped>
    .selected {
        background-color: lightblue;
    }
</style>
