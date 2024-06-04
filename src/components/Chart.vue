<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height"></canvas>
    <!-- <button @click="toggleScale">Toggle Y-Axis Scale</button> -->
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
});
const drawLineChart = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Find min and max values to scale points
  const plottingValues = props.points.map(p => ({
    x: p.x,
    y: state.isLogScale ? Math.log10(p.y) : p.y
  }))

  const xValues = plottingValues.map(p => p.x);
  const yValues = plottingValues.map(p => p.y)

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const padding = 50;
  const xScale = (width - padding * 2) / (xMax - xMin);
  const yScale = (height - padding * 2) / ((yMax) - yMin);

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

  // Draw points and lines
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
    ctx.arc(x, y, 3, 0, Math.PI * 2);
  });
  ctx.stroke();
}; 

onMounted(drawLineChart);
watch(() => [props.points, state.isLogScale], drawLineChart, { deep: true });
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}

button {
  margin-top: 10px;
}
</style>
