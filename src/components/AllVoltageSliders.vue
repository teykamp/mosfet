script<template>
    <div style="position: absolute; top: 10px; left: 100px;">
        <div v-for="sliderGroup in htmlSliders"
            :style="`border: 1px solid black; width: ${widthPx}px`"
            :tabindex="1" :class="{selected: sliderGroup.deviceSelected.value}"
            @focus="setDeviceSelected(sliderGroup, true)"
            @blur="setDeviceSelected(sliderGroup, false)"
            :ref="(element) => {
                if (element && sliderGroup.deviceSelected.value) {
                    if ('focus' in element) {
                        (element.focus as Function)() // element.focus() also works; the type casting is for the VS code linter
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

    defineProps<{
        htmlSliders: Named<HtmlSlider[]>[]
        widthPx: number
    }>()

    const setDeviceSelected = (sliderGroup: Named<HtmlSlider[]>, focused: boolean) => {
        sliderGroup.deviceSelected.value = focused
    }
</script>

<style scoped>
    .selected {
        background-color: lightblue;
    }
</style>
