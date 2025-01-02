<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @mousedown="onMouseDown"></canvas>
    <button @click="toggleYAxisLog">Toggle Log Scale</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { getTickLabelList, getTickLabelListLog } from '../functions/getTickLabelList'
import { toSiPrefix } from '../functions/toSiPrefix'
import type { Point } from '../types'

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
const width = props.width ?? 800 / 4
const height = props.height ?? 600 / 6
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
const paddingL = 40
const paddingR = 40
const paddingT = 25
const paddingB = 30

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

  if (cornerToCornerGraph) {
    const margin = 0
    xTicks.value = xTicks.value.filter((x) => (xMin.value - Math.abs(xMin.value) * margin <= x) && (x <= xMax.value + Math.abs(xMax.value) * margin))
    yTicks.value = yTicks.value.filter((y) => (yMin.value - Math.abs(yMin.value) * margin <= y) && (y <= yMax.value + Math.abs(yMax.value) * margin))
  }

  xScale.value = (width - paddingL - paddingR) / (xMax.value - xMin.value)
  yScale.value = (height - paddingT - paddingB) / (yMax.value - yMin.value)
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
  ctx.moveTo(paddingL, height - paddingB)
  ctx.lineTo(width - paddingR, height - paddingB) // X axis
  ctx.moveTo(paddingL, height - paddingB)
  ctx.lineTo(paddingL, paddingT) // Y axis
  ctx.stroke()

  // Draw axis labels
  ctx.font = '16px Arial'
  ctx.fillText(props.xAxisLabel, width - paddingL + 5, height - paddingB + 5)
  ctx.fillText(props.yAxisLabel, paddingL / 2, 20)

  // Draw units
  // ctx.fillText(props.xUnit, width - paddingL + 10, height - paddingB)
  // ctx.fillText(props.yUnit, paddingL - 30, paddingT - 10)

  // Calculate and draw ticks
  ctx.strokeStyle = '#ccc'
  ctx.font = '12px Arial'
  ctx.fillStyle = '#000'


  xTicks.value.forEach((value: number) => {
    const x = paddingL + (value - xMin.value) * xScale.value
    const displayValue = toSiPrefix(state.xScaleType === 'log' ? (10 ** value) : value, props.xUnit)
    ctx.beginPath()
    ctx.moveTo(x, height - paddingB)
    ctx.lineTo(x, height - paddingB + 5)
    ctx.stroke()
    ctx.fillText(displayValue, x - 10, height - paddingB + 20)
  })

  yTicks.value.forEach((value: number) => {
    const y = height - paddingB - (value - yMin.value) * yScale.value
    const displayValue = toSiPrefix(state.yScaleType === 'log' ? (10 ** value) : value, props.yUnit)
    ctx.beginPath()
    ctx.moveTo(paddingL, y)
    ctx.lineTo(paddingL - 5, y)
    ctx.stroke()
    ctx.fillText(displayValue, paddingL - 35, y + 5, 30) // last parameter specifies a maximum width of the text
  })

  // Draw line
  ctx.strokeStyle = '#f00'
  ctx.beginPath()
  plottingValues.value.forEach((point: Point, index: number) => {
    const x = paddingL + (point.x - xMin.value) * xScale.value
    const y = height - paddingB - (point.y - yMin.value) * yScale.value
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
    const dragX = paddingL + (dragPoint.x - xMin.value) * xScale.value
    const dragY = height - paddingB - (dragPoint.y - yMin.value) * yScale.value
    ctx.beginPath()
    ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.moveTo(dragX, dragY)
    ctx.lineTo(dragX, height - paddingB)
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
    const pointX = paddingL + (point.x - xMin.value) * xScale.value
    const distance = Math.abs(pointX - mouseX)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })
  return closestIndex
}

const onMouseDown = () => {
  state.dragging = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event: MouseEvent) => {
  if (!state.dragging) return
  const { mouseX } = getMousePos(event)
  const closestIndex = getClosestPointIndex(mouseX)
  state.currentPointIndex = closestIndex
}

const onMouseUp = () => {
  state.dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
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
