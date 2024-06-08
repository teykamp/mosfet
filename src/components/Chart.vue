<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @mousedown="onMouseDown" @mouseup="onMouseUp"
      @mousemove="onMouseMove"></canvas>
      <button @click="toggleYAxisLog"></button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue';

interface Point {
  x: number;
  y: number;
}

interface Props {
  points: Point[];
  xAxisLabel: string;
  yAxisLabel: string;
  xUnit: string;
  yUnit: string;
  width?: number;
  height?: number;
}

const props = defineProps<Props>();
const canvas = ref<HTMLCanvasElement | null>(null);
const width = props.width ?? 800;
const height = props.height ?? 600;
const state = reactive({
  isLogScale: true,
  dragging: false,
  currentPointIndex: 0,
});
const padding = 50;

const toggleYAxisLog = () => {
  state.isLogScale = !state.isLogScale
}

const drawLineChart = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Find min and max values to scale points
  const plottingValues = props.points.map(p => ({
    x: p.x,
    y: state.isLogScale ? Math.log10(p.y) : p.y
  }));

  const xValues = plottingValues.map(p => p.x);
  const yValues = plottingValues.map(p => p.y);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xScale = (width - padding * 2) / (xMax - xMin);
  const yScale = (height - padding * 2) / (yMax - yMin);

  // Draw axis
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding); // X axis
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(padding, padding); // Y axis
  ctx.stroke();

  // Draw axis labels
  ctx.font = '16px Arial';
  ctx.fillText(props.xAxisLabel, width / 2, height - 10);
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(props.yAxisLabel, -height / 2, 20);
  ctx.restore();

  // Draw units
  ctx.fillText(props.xUnit, width - padding + 10, height - padding);
  ctx.fillText(props.yUnit, padding - 30, padding - 10);

  // Calculate and draw ticks
  const numXTicks = 10;
  const numYTicks = 10;

  const xTickInterval = (xMax - xMin) / numXTicks;
  const yTickInterval = (yMax - yMin) / numYTicks;

  ctx.strokeStyle = '#ccc';
  ctx.font = '12px Arial';
  ctx.fillStyle = '#000';

  for (let i = 0; i <= numXTicks; i++) {
    const x = padding + (i * (width - padding * 2) / numXTicks);
    const value = xMin + i * xTickInterval;
    ctx.beginPath();
    ctx.moveTo(x, height - padding);
    ctx.lineTo(x, height - padding + 5);
    ctx.stroke();
    ctx.fillText(value.toFixed(2), x - 10, height - padding + 20);
  }

  for (let i = 0; i <= numYTicks; i++) {
    const y = height - padding - (i * (height - padding * 2) / numYTicks);
    const value = yMin + i * yTickInterval;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding - 5, y);
    ctx.stroke();
    ctx.fillText((10 ** value).toFixed(2), padding - 35, y + 5);
  }

  // draw line
  ctx.strokeStyle = '#f00';
  ctx.beginPath();
  plottingValues.forEach((point, index) => {
    const x = padding + (point.x - xMin) * xScale;
    const y = height - padding - (point.y - yMin) * yScale;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw draggable circle
  const dragPoint = plottingValues[state.currentPointIndex];
  console.log(dragPoint.y)
  if (dragPoint) {
    const dragX = padding + (dragPoint.x - xMin) * xScale;
    const dragY = height - padding - (dragPoint.y - yMin) * yScale;
    ctx.beginPath();
    ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.moveTo(dragX, dragY)
    ctx.lineTo(dragX, height - padding)
    ctx.stroke()
    ctx.fillText(plottingValues[state.currentPointIndex].y.toExponential(2), dragX, dragY - 10)
  }
};

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 };
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  return { mouseX, mouseY };
};

const getClosestPointIndex = (mouseX: number) => {
  const xMin = Math.min(...props.points.map(p => p.x));
  const xMax = Math.max(...props.points.map(p => p.x));
  const xScale = (width - padding * 2) / (xMax - xMin);

  let closestIndex = 0;
  let closestDistance = Infinity;

  props.points.forEach((point, index) => {
    const pointX = padding + (point.x - xMin) * xScale;
    const distance = Math.abs(pointX - mouseX);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
};

const onMouseDown = (event: MouseEvent) => {
  state.dragging = true;
};

const onMouseMove = (event: MouseEvent) => {
  if (!state.dragging) return;
  const { mouseX } = getMousePos(event);
  const closestIndex = getClosestPointIndex(mouseX);
  state.currentPointIndex = closestIndex;
  drawLineChart();
};

const onMouseUp = () => {
  state.dragging = false;
};

onMounted(drawLineChart);
watch(() => [props.points, state.isLogScale, state.currentPointIndex], drawLineChart, { deep: true });

</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}

button {
  margin-top: 10px;
}
</style>
