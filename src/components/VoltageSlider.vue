script<template>
    <div v-if="visibility == 'visible' || visibility == 'locked'" style="user-select: none;">
        {{ minValue }}
        <canvas
            ref="canvas"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            :style="`background-color: white; width: ${props.sliderWidthPx}px; height: ${sliderHeightPx}px; border: 1px solid black`"
            class="mosfet"
        ></canvas>
    </div>
</template>

<script setup lang='ts'>
    import { onMounted, Ref, ref, watch } from 'vue';
    import { eventInitiatesPreciseDragging } from '../functions/eventInitiatesPreciseDragging';
    import { Visibility } from '../types';
    import { LinearSlider } from '../classes/linearSlider';
    import { TransformationMatrix } from '../classes/transformationMatrix';

    const props = defineProps<{
        slider: LinearSlider,
        sliderWidthPx: number,
    }>()

    const sliderHeightPx = 50

    const canvas = ref<null | HTMLCanvasElement>(null)
    const ctx = ref<null | CanvasRenderingContext2D>(null)

    const minValue: Ref<number> = ref(props.slider.temporaryMinValue)
    const maxValue: Ref<number> = ref(props.slider.temporaryMaxValue)
    const value: Ref<number> = ref(props.slider.value)
    const visibility: Ref<Visibility> = ref(props.slider.visibility)
    const preciseDragging: Ref<boolean> = ref(props.slider.preciseDragging)

    watch([() => props.slider.temporaryMinValue, () => props.slider.temporaryMaxValue, () => props.slider.visibility, () => props.slider.preciseDragging, () => props.slider.updated.value], ([newMinValue, newMaxValue, newVisibility, newPreciseDragging, _]) => {
        minValue.value = newMinValue
        maxValue.value = newMaxValue
        visibility.value = newVisibility
        preciseDragging.value = newPreciseDragging
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
        console.log(event.clientX, event.clientY)
        props.slider.checkDrag({x: 0, y: 0}, eventInitiatesPreciseDragging(event))
    }

    const onPointerMove = (event: PointerEvent) => {
        props.slider.dragSlider(event)
    }

    const onPointerUp = () => {
        props.slider.releaseSlider() // sets props.slider.dragging to false
    }

    const animate = () => {
        draw()
        requestAnimationFrame(animate)
    }

    const draw = () => {
        if (!canvas.value) {
            console.error("Error setting up voltage slider canvas")
            return
        }
        ctx.value = canvas.value.getContext('2d')

        if (!ctx.value) {
            return
        }

        ctx.value.resetTransform()
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

        props.slider.draw(ctx.value)
    }

    onMounted(() => {
        props.slider.transformations.push(ref((new TransformationMatrix()).translate({x: 20, y: sliderHeightPx / 2})) as Ref<TransformationMatrix>)
        props.slider.length = props.sliderWidthPx
        animate()
    })

</script>

<style scoped>

</style>
