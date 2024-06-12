<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @mousedown="onMouseDown" @mouseup="onMouseUp"
      @mousemove="onMouseMove"></canvas>
    <button @click="toggleYAxisLog">Toggle Log Scale</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue'

interface Point {
  x: number
  y: number
}

interface Props {
  points: Point[]
  xAxisLabel: string
  yAxisLabel: string
  xUnit: string
  yUnit: string
  width?: number
  height?: number
  customXTicks?: {
    linear?: number[],
    log?: number[],
  }
  customYTicks?: {
    log?: number[],
    linear?: number[],
  }
}

const props = defineProps<Props>()
const canvas = ref<HTMLCanvasElement | null>(null)
const width = props.width ?? 800
const height = props.height ?? 600

const state = reactive<{
  xScaleType: 'log' | 'linear',
  yScaleType: 'log' | 'linear',
  dragging: boolean,
  currentPointIndex: number,
}>({
  xScaleType: 'linear',
  yScaleType: 'log',
  dragging: false,
  currentPointIndex: 0,
})
const padding = 50

const customXTicks = {
  log: props.customXTicks?.log ?? [],
  linear: props.customXTicks?.linear ?? [],
} ?? { log: [], linear: [] }

const customYTicks = {
  log: props.customYTicks?.log ?? [],
  linear: props.customYTicks?.linear ?? [],
} ?? { log: [], linear: [] }

const xValues = ref<number[]>([])
const yValues = ref<number[]>([])
const xMin = ref<number>(0)
const xMax = ref<number>(0)
const yMin = ref<number>(0)
const yMax = ref<number>(0)

const xTicks = ref<number[]>([])
const yTicks = ref<number[]>([])
const xScale = ref<number>(0)
const yScale = ref<number>(0)

const plottingValues = computed(() => props.points
  .map(p => ({
    x: state.xScaleType === 'log' ? Math.log10(p.x) : p.x,
    y: state.yScaleType === 'log' ? Math.log10(p.y) : p.y
  }))
  .filter(p => p.x >= xMin.value && p.x <= xMax.value && p.y >= yMin.value && p.y <= yMax.value)
)

const calculateValues = () => {
  xValues.value = props.points.map(p => state.xScaleType === 'log' ? Math.log10(p.x) : p.x)
  yValues.value = props.points.map(p => state.yScaleType === 'log' ? Math.log10(p.y) : p.y)
  xMin.value = customXTicks[state.xScaleType].length > 1 ? Math.min(...customXTicks[state.xScaleType]) : Math.min(...xValues.value)
  xMax.value = customXTicks[state.xScaleType].length > 1 ? Math.max(...customXTicks[state.xScaleType]) : Math.max(...xValues.value)
  yMin.value = customYTicks[state.yScaleType].length > 1 ? Math.min(...customYTicks[state.yScaleType]) : Math.min(...yValues.value)
  yMax.value = customYTicks[state.yScaleType].length > 1 ? Math.max(...customYTicks[state.yScaleType]) : Math.max(...yValues.value)

  xTicks.value = customXTicks[state.xScaleType].length > 1 ? customXTicks[state.xScaleType] : Array.from({ length: 11 }, (_, i) => xMin.value + i * (xMax.value - xMin.value) / 10)
  yTicks.value = customYTicks[state.yScaleType].length > 1 ? customYTicks[state.yScaleType] : Array.from({ length: 11 }, (_, i) => yMin.value + i * (yMax.value - yMin.value) / 10)
  xScale.value = (width - padding * 2) / (xMax.value - xMin.value)
  yScale.value = (height - padding * 2) / (yMax.value - yMin.value)
}


const toggleYAxisLog = () => {
  // state.xScaleType = state.xScaleType === 'log' ? 'linear' : 'log'
  state.yScaleType = state.yScaleType === 'log' ? 'linear' : 'log'
}

const drawLineChart = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  calculateValues()

  ctx.clearRect(0, 0, width, height)

  // Draw axis
  ctx.strokeStyle = '#000'
  ctx.beginPath()
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding) // X axis
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(padding, padding) // Y axis
  ctx.stroke()

  // Draw axis labels
  ctx.font = '16px Arial'
  ctx.fillText(props.xAxisLabel, width / 2, height - 10)
  ctx.save()
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(props.yAxisLabel, -height / 2, 20)
  ctx.restore()

  // Draw units
  ctx.fillText(props.xUnit, width - padding + 10, height - padding)
  ctx.fillText(props.yUnit, padding - 30, padding - 10)

  // Calculate and draw ticks
  ctx.strokeStyle = '#ccc'
  ctx.font = '12px Arial'
  ctx.fillStyle = '#000'

  
  xTicks.value.forEach((value) => {
    const x = padding + (value - xMin.value) * xScale.value
    const displayValue = state.xScaleType === 'log' ? (10 ** value).toExponential(2) : value.toExponential(2)
    ctx.beginPath()
    ctx.moveTo(x, height - padding)
    ctx.lineTo(x, height - padding + 5)
    ctx.stroke()
    ctx.fillText(displayValue, x - 10, height - padding + 20)
  })

  yTicks.value.forEach((value) => {
    const y = height - padding - (value - yMin.value) * yScale.value
    const displayValue = state.yScaleType === 'log' ? (10 ** value).toExponential(2) : value.toExponential(2)
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding - 5, y)
    ctx.stroke()
    ctx.fillText(displayValue, padding - 35, y + 5)
  })

  // Draw line
  ctx.strokeStyle = '#f00'
  ctx.beginPath()
  plottingValues.value.forEach((point, index) => {
    const x = padding + (point.x - xMin.value) * xScale.value
    const y = height - padding - (point.y - yMin.value) * yScale.value
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // Draw draggable circle
  const dragPoint = plottingValues.value[state.currentPointIndex]
  if (dragPoint) {
    const dragX = padding + (dragPoint.x - xMin.value) * xScale.value
    const dragY = height - padding - (dragPoint.y - yMin.value) * yScale.value
    ctx.beginPath()
    ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.moveTo(dragX, dragY)
    ctx.lineTo(dragX, height - padding)
    ctx.stroke()
    ctx.fillText((10 ** dragPoint.y).toExponential(2), dragX, dragY - 10)
  }
}

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  return { mouseX, mouseY }
}

const getClosestPointIndex = (mouseX: number) => {
  let closestIndex = 0
  let closestDistance = Infinity

  plottingValues.value.forEach((point, index) => {
    const pointX = padding + (point.x - xMin.value) * xScale.value
    const distance = Math.abs(pointX - mouseX)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })
  return closestIndex
}

const onMouseDown = (event: MouseEvent) => {
  state.dragging = true
}

const onMouseMove = (event: MouseEvent) => {
  if (!state.dragging) return
  const { mouseX } = getMousePos(event)
  const closestIndex = getClosestPointIndex(mouseX)
  state.currentPointIndex = closestIndex
}

const onMouseUp = () => {
  state.dragging = false
}

onMounted(drawLineChart)
watch(() => [props.points, state.xScaleType, state.yScaleType, state.currentPointIndex], drawLineChart, { deep: true })

</script>

<style scoped>
canvas {
  border: 1px solid #ccc
}

button {
  margin-top: 10px
}
</style>
