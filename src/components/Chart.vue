<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @mousedown="onMouseDown" @mouseup="onMouseUp"
      @mousemove="onMouseMove"></canvas>
    <!-- <button @click="toggleYAxisLog">Toggle Y Axis Log Scale</button> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'

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
  scaleType: 'log' | 'linear',
  dragging: boolean,
  currentPointIndex: number,
}>({
  scaleType: 'log',
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


const xValues = props.points.map(p => p.x)
// the following need to be regenerated after ever toggle of chart (make them refs??)
const yValues = props.points.map(p => state.scaleType === 'log' ? Math.log10(p.y) : p.y)
const xMin = customXTicks[state.scaleType].length > 1 ? Math.min(...customXTicks[state.scaleType]) : Math.min(...xValues)
const xMax = customXTicks[state.scaleType].length > 1 ? Math.max(...customXTicks[state.scaleType]) : Math.max(...xValues)
const yMin = customYTicks[state.scaleType].length > 1 ? Math.min(...customYTicks[state.scaleType]) : Math.min(...yValues)
const yMax = customYTicks[state.scaleType].length > 1 ? Math.max(...customYTicks[state.scaleType]) : Math.max(...yValues)

const xTicks = customXTicks[state.scaleType].length > 1 ? customXTicks[state.scaleType] : Array.from({ length: 11 }, (_, i) => xMin + i * (xMax - xMin) / 10)
const yTicks = customYTicks[state.scaleType].length > 1 ? customYTicks[state.scaleType] : Array.from({ length: 11 }, (_, i) => yMin + i * (yMax - yMin) / 10)
const xScale = (width - padding * 2) / (xMax - xMin)
const yScale = (height - padding * 2) / (yMax - yMin)

const plottingValues = props.points
  .map(p => ({
    x: p.x,
    y: state.scaleType === 'log' ? Math.log10(p.y) : p.y
  }))
  .filter(p => p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax)

// const toggleYAxisLog = () => {
//   state.scaleType = state.scaleType === 'log' ? 'linear' : 'log'
// }

const drawLineChart = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

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

  
  xTicks.forEach((value) => {
    const x = padding + (value - xMin) * xScale
    ctx.beginPath()
    ctx.moveTo(x, height - padding)
    ctx.lineTo(x, height - padding + 5)
    ctx.stroke()
    ctx.fillText(value.toFixed(2), x - 10, height - padding + 20)
  })

  yTicks.forEach((value) => {
    const y = height - padding - (value - yMin) * yScale
    const displayValue = state.scaleType === 'log' ? (10 ** value).toExponential(2) : value.toFixed(2)
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding - 5, y)
    ctx.stroke()
    ctx.fillText(displayValue, padding - 35, y + 5)
  })

  // Draw line
  ctx.strokeStyle = '#f00'
  ctx.beginPath()
  plottingValues.forEach((point, index) => {
    const x = padding + (point.x - xMin) * xScale
    const y = height - padding - (point.y - yMin) * yScale
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // Draw draggable circle
  const dragPoint = plottingValues[state.currentPointIndex]
  if (dragPoint) {
    const dragX = padding + (dragPoint.x - xMin) * xScale
    const dragY = height - padding - (dragPoint.y - yMin) * yScale
    ctx.beginPath()
    ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.moveTo(dragX, dragY)
    ctx.lineTo(dragX, height - padding)
    ctx.stroke()
    ctx.fillText(dragPoint.y.toExponential(2), dragX, dragY - 10)
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

  plottingValues.forEach((point, index) => {
    const pointX = padding + (point.x - xMin) * xScale
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
watch(() => [props.points, state.scaleType, state.currentPointIndex], drawLineChart, { deep: true })

</script>

<style scoped>
canvas {
  border: 1px solid #ccc
}

button {
  margin-top: 10px
}
</style>
