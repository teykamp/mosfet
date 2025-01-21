<template>
    <div>
        <!-- :tabindex="sliderGroup.deviceType == 'voltageSource' ? -1 : 1" :class="{selected: sliderGroup.deviceSelected.value}" -->
        <div v-for="sliderGroup in htmlSliders"
            style="border: 1px solid black;"
            :tabindex="sliderGroup.deviceType == 'voltageSource' ? 1 : 1" :class="{selected: sliderGroup.deviceSelected.value}"
            @focus="setDeviceSelected(sliderGroup)"
            @keydown="(event) => onKeyDown(event, sliderGroup)"

            :ref="(element) => {
                if (element && sliderGroup.deviceSelected.value) { // element may be null on the first iteration because it is not mounted yet.

                    // Only trigger this ref when deviceSelected changes (as opposed to the default :ref behavior which triggers whenever any property changes, for example the voltages on the htmlSliders).
                    // There is a watch() function on sliderGroup.selectionChanged, initialized inside the Device constructor, which sets selectionChanged.value to true whenever deviceSelected changes value.
                    if (sliderGroup.selectionChanged.value) {
                        sliderGroup.selectionChanged.value = false

                        // A little bit of type checking to see if element.focus() exists and is a function
                        // This is mainly needed to make VS Code happy
                        if ('focus' in element) {
                            (element.focus as Function)() // ({preventScroll: true, focusVisible: false})
                        }
                        // or simply element.focus() without the type checking
                    }
                }
        }">
            <div style="display: flex; justify-content: center;">
                {{ sliderGroup.name }}
            </div>
            <VoltageSlider v-for="slider in sliderGroup.value" :html-slider="slider"
                @slider-selected="() => onSliderSelected(sliderGroup)"
                @step-out-selection="() => stepOutSelection(sliderGroup)"
                @select-other-slider="(sliderIdx) => selectOtherSlider(sliderGroup, sliderIdx)"
            ></VoltageSlider>
        </div>
    </div>
</template>

<script setup lang='ts'>
    import { HtmlSlider } from '../classes/ctxSlider'
    import { DIRECTIONS, keysToDirections, Named } from '../types'
    import VoltageSlider from './VoltageSlider.vue'

    const props = defineProps<{
        htmlSliders: Named<HtmlSlider[]>[],
    }>()

    let keyDownOnSlider: boolean = false

    const setDeviceSelected = (sliderGroup: Named<HtmlSlider[]>) => {
        unselectAllDevices()
        unselectAllSliders()
        sliderGroup.selectionChanged.value = true
        sliderGroup.deviceSelected.value = true
    }

    const onSliderSelected = (sliderGroup: Named<HtmlSlider[]>) => {
        unselectAllSliders()
        sliderGroup.value.forEach((slider: HtmlSlider) => {
            slider.tabIndex.value = 1
        })
    }

    const stepOutSelection = (sliderGroup: Named<HtmlSlider[]>) => {
        setDeviceSelected(sliderGroup)
        keyDownOnSlider = true
    }

    const selectOtherSlider = (sliderGroup: Named<HtmlSlider[]>, sliderIdxToSelect: number) => {
        if (sliderIdxToSelect < sliderGroup.value.length) {
            unselectAllSliders()
            sliderGroup.value[sliderIdxToSelect].selected.value = true
            sliderGroup.value[sliderIdxToSelect].selectionChanged.value = true
        }
    }

    const unselectAllDevices = () => {
        props.htmlSliders.forEach((otherSliderGroup: Named<HtmlSlider[]>) => {
            otherSliderGroup.deviceSelected.value = false
        })
    }

    const unselectAllSliders = () => {
        props.htmlSliders.forEach((otherSliderGroup: Named<HtmlSlider[]>) => {
            otherSliderGroup.value.forEach((slider: HtmlSlider) => {
                slider.selected.value = false
                slider.tabIndex.value = -1
            })
        })
    }

    const anySlidersSelected = (): boolean => {
        let result = false
        props.htmlSliders.forEach((otherSliderGroup: Named<HtmlSlider[]>) => {
            otherSliderGroup.value.forEach((slider: HtmlSlider) => {
                if (slider.selected.value) {
                    result = true
                }
            })
        })
        return result
    }

    const onKeyDown = (event: KeyboardEvent, sliderGroup: Named<HtmlSlider[]>) => {
        if (event.key == 'Enter') {
            if (!keyDownOnSlider) {
                unselectAllSliders()
                if (sliderGroup.value[0].visibility == 'visible') {
                    sliderGroup.value[0].selected.value = true
                }
            }
            keyDownOnSlider = false
        }

        if (!anySlidersSelected()) {
            if (DIRECTIONS.includes(keysToDirections[event.key])) {
                if (Object.keys(sliderGroup.adjacencyList).includes(keysToDirections[event.key])) {
                    const deviceKey = sliderGroup.adjacencyList[keysToDirections[event.key]]
                    if (deviceKey != '') {
                        let deviceExists = false
                        props.htmlSliders.forEach((otherSliderGroup: Named<HtmlSlider[]>) => {
                            if (otherSliderGroup.name == deviceKey) {
                                deviceExists = true
                                event.preventDefault()
                                unselectAllDevices()
                                otherSliderGroup.deviceSelected.value = true
                                otherSliderGroup.selectionChanged.value = true
                            }
                        })
                        if (!deviceExists) {
                            console.error("Could not find device by key ''" + String(deviceKey) + "'")
                        }
                    }
                }
            }
        }
    }
</script>

<style scoped>
    .selected {
        background-color: lightblue;
    }
</style>
