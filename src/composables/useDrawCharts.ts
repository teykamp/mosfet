import { ref, Ref, reactive, computed, watch } from 'vue'
import type { Chart, Point } from '../types'
import { getTickLabelList, getTickLabelListLog } from '../functions/getTickLabelList'
import { toSiPrefix } from '../functions/toSiPrefix'

const useDrawCharts = (canvas: Ref<HTMLCanvasElement>, chartData: Chart, origin: Point) => {
  const width = chartData.width ?? 800 / 4
  const height = chartData.height ?? 600 / 6
  const cornerToCornerGraph = chartData.cornerToCornerGraph ?? true

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

  const plottingValues = computed(() => chartData.points
  .map((p: Point) => ({
      x: state.xScaleType === 'log' ? Math.log10(p.x) : p.x,
      y: state.yScaleType === 'log' ? Math.log10(p.y) : p.y
    }))
    .filter((p: Point) => p.x >= xMin.value && p.x <= xMax.value && p.y >= yMin.value && p.y <= yMax.value)
  )

  const calculateValues = () => {
    xValues.value = chartData.points.map((p: Point) => state.xScaleType === 'log' ? Math.log10(p.x) : p.x)
    yValues.value = chartData.points.map((p: Point) => state.yScaleType === 'log' ? Math.log10(p.y) : p.y)

    xTicks.value = state.xScaleType === 'log' ? getTickLabelListLog(Math.min(...chartData.points.map((p: Point) => p.x)), Math.max(...chartData.points.map((p: Point) => p.x))).map(Math.log10) : getTickLabelList(Math.min(...chartData.points.map((p: Point) => p.x)), Math.max(...chartData.points.map((p: Point) => p.x)))
    yTicks.value = state.yScaleType === 'log' ? getTickLabelListLog(Math.min(...chartData.points.map((p: Point) => p.y)), Math.max(...chartData.points.map((p: Point) => p.y))).map(Math.log10) : getTickLabelList(Math.min(...chartData.points.map((p: Point) => p.y)), Math.max(...chartData.points.map((p: Point) => p.y)))

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

    ctx.clearRect(origin.x, origin.y, width, height) //  if you want blank background

    // Draw axis
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(paddingL + origin.x, height - paddingB + origin.y)
    ctx.lineTo(width - paddingR + origin.x, height - paddingB + origin.y) // X axis
    ctx.moveTo(paddingL + origin.x, height - paddingB + origin.y)
    ctx.lineTo(paddingL + origin.x, paddingT + origin.y) // Y axis
    ctx.stroke()

    // Draw axis labels
    ctx.font = '16px Arial'
    ctx.fillText(chartData.xAxisLabel, width - paddingL + 5 + origin.x, height - paddingB + 5 + origin.y)
    ctx.fillText(chartData.yAxisLabel, paddingL / 2 + origin.x, 20 + origin.y)

    // Draw units
    // ctx.fillText(chartData.xUnit, width - paddingL + 10, height - paddingB)
    // ctx.fillText(chartData.yUnit, paddingL - 30, paddingT - 10)

    // Calculate and draw ticks
    ctx.strokeStyle = '#ccc'
    ctx.font = '12px Arial'
    ctx.fillStyle = '#000'


    xTicks.value.forEach((value: number) => {
      const x = paddingL + (value - xMin.value) * xScale.value + + origin.x
      const displayValue = toSiPrefix(state.xScaleType === 'log' ? (10 ** value) : value, chartData.xUnit)
      ctx.beginPath()
      ctx.moveTo(x, height - paddingB + origin.y)
      ctx.lineTo(x, height - paddingB + 5 + origin.y)
      ctx.stroke()
      ctx.fillText(displayValue, x - 10, height - paddingB + 20 + origin.y)
    })

    yTicks.value.forEach((value: number) => {
      const y = height - paddingB - (value - yMin.value) * yScale.value + origin.y
      const displayValue = toSiPrefix(state.yScaleType === 'log' ? (10 ** value) : value, chartData.yUnit)
      ctx.beginPath()
      ctx.moveTo(paddingL + origin.x, y)
      ctx.lineTo(paddingL - 5 + origin.x, y)
      ctx.stroke()
      ctx.fillText(displayValue, paddingL - 35 + origin.x, y + 5, 30) // last parameter specifies a maximum width of the text
    })

    // Draw line
    ctx.strokeStyle = '#f00'
    ctx.beginPath()
    plottingValues.value.forEach((point: Point, index: number) => {
      const x = paddingL + (point.x - xMin.value) * xScale.value + origin.x
      const y = height - paddingB - (point.y - yMin.value) * yScale.value + origin.y
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
      const dragX = paddingL + (dragPoint.x - xMin.value) * xScale.value + origin.x
      const dragY = height - paddingB - (dragPoint.y - yMin.value) * yScale.value + origin.y
      ctx.beginPath()
      ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.moveTo(dragX, dragY)
      ctx.lineTo(dragX, height - paddingB + origin.y)
      ctx.stroke()
      ctx.fillText(toSiPrefix(state.yScaleType === 'log' ? 10 ** dragPoint.y : dragPoint.y, chartData.yUnit), dragX, dragY - 10)
    }
  }

  const getMousePos = (event: MouseEvent) => {
    if (!canvas.value) return { mouseX: 0, mouseY: 0 }
    const rect = canvas.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    return { mouseX, mouseY }
  }

  const getClosestPointIndex = (xValue: number): void => {
    let closestIndex = 0
    let closestDistance = Infinity

    plottingValues.value.forEach((point: Point, index: number) => {
      const pointX = point.x
      const distance = Math.abs(pointX - xValue)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    state.currentPointIndex = closestIndex
  }
  // const getClosestPointIndex = (xValue: number) => {
  //   let closestIndex = 0
  //   let closestDistance = Infinity

  //   plottingValues.value.forEach((point: Point, index: number) => {
  //     const pointX = paddingL + (point.x - xMin.value) * xScale.value
  //     const distance = Math.abs(pointX - xValue)
  //     if (distance < closestDistance) {
  //       closestDistance = distance
  //       closestIndex = index
  //     }
  //   })
  //   state.currentPointIndex = closestIndex
  // }

  // const onMouseDown = () => {
  //   state.dragging = true
  //   document.addEventListener('mousemove', onMouseMove)
  //   document.addEventListener('mouseup', onMouseUp)
  // }

  // const onMouseMove = (event: MouseEvent) => {
  //   if (!state.dragging) return
  //   const { mouseX } = getMousePos(event)
  //   const closestIndex = getClosestPointIndex(mouseX)
  //   state.currentPointIndex = closestIndex
  // }

  // const onMouseUp = () => {
  //   state.dragging = false
  //   document.removeEventListener('mousemove', onMouseMove)
  //   document.removeEventListener('mouseup', onMouseUp)
  // }

  // onMounted(drawLineChart)
  watch(() => [chartData.points, state.xScaleType, state.yScaleType, state.currentPointIndex], drawLineChart, { deep: true })

  return {
    drawLineChart,
    toggleYAxisLog,
    getClosestPointIndex
  }
}

export default useDrawCharts