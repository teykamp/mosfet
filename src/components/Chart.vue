<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @mousedown="onMouseDown" @mouseup="onMouseUp"
      @mousemove="onMouseMove"></canvas>
    <button @click="toggleYAxisLog">Toggle Log Scale</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { getTickLabelList, getTickLabelListLog } from '../functions/getTickLabelList'
import { toSiPrefix } from '../functions/toSiPrefix'

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
  cornerToCornerGraph?: boolean
}

const props = defineProps<Props>()
const canvas = ref<HTMLCanvasElement | null>(null)
const width = props.width ?? 800
const height = props.height ?? 600
const cornerToCornerGraph = props.cornerToCornerGraph ?? true

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
  .map((p: Point) => ({
    x: state.xScaleType === 'log' ? Math.log10(p.x) : p.x,
    y: state.yScaleType === 'log' ? Math.log10(p.y) : p.y
  }))
  .filter((p: Point) => p.x >= xMin.value && p.x <= xMax.value && p.y >= yMin.value && p.y <= yMax.value)
)

const calculateValues = () => {
  xValues.value = props.points.map((p: Point) => state.xScaleType === 'log' ? Math.log10(p.x) : p.x)
  yValues.value = props.points.map((p: Point) => state.yScaleType === 'log' ? Math.log10(p.y) : p.y)

  xTicks.value = state.xScaleType === 'log' ? getTickLabelListLog(Math.min(...props.points.map((p: Point) => p.x)), Math.max(...props.points.map((p: Point) => p.x))).map(Math.log10) : getTickLabelList(Math.min(...props.points.map((p: Point) => p.x)), Math.max(...props.points.map((p: Point) => p.x)))
  yTicks.value = state.yScaleType === 'log' ? getTickLabelListLog(Math.min(...props.points.map((p: Point) => p.y)), Math.max(...props.points.map((p: Point) => p.y))).map(Math.log10) : getTickLabelList(Math.min(...props.points.map((p: Point) => p.y)), Math.max(...props.points.map((p: Point) => p.y)))

  xMin.value = cornerToCornerGraph ? Math.min(...xValues.value) : Math.min(...xTicks.value)
  xMax.value = cornerToCornerGraph ? Math.max(...xValues.value) : Math.max(...xTicks.value)
  yMin.value = cornerToCornerGraph ? Math.min(...yValues.value) : Math.min(...yTicks.value)
  yMax.value = cornerToCornerGraph ? Math.max(...yValues.value) : Math.max(...yTicks.value)

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


  xTicks.value.forEach((value: number) => {
    const x = padding + (value - xMin.value) * xScale.value
    const displayValue = toSiPrefix(state.xScaleType === 'log' ? (10 ** value) : value, props.xUnit)
    ctx.beginPath()
    ctx.moveTo(x, height - padding)
    ctx.lineTo(x, height - padding + 5)
    ctx.stroke()
    ctx.fillText(displayValue, x - 10, height - padding + 20)
  })

  yTicks.value.forEach((value: number) => {
    const y = height - padding - (value - yMin.value) * yScale.value
    const displayValue = toSiPrefix(state.yScaleType === 'log' ? (10 ** value) : value, props.yUnit)
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding - 5, y)
    ctx.stroke()
    ctx.fillText(displayValue, padding - 35, y + 5)
  })

  // Draw line
  ctx.strokeStyle = '#f00'
  ctx.beginPath()
  plottingValues.value.forEach((point: Point, index: number) => {
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
    ctx.fillText(toSiPrefix(state.yScaleType === 'log' ? 10 ** dragPoint.y : dragPoint.y, props.yUnit), dragX, dragY - 10)
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

  plottingValues.value.forEach((point: Point, index: number) => {
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
