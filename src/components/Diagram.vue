<template>
  <canvas ref="canvas" @mousemove="handleMouseMove" width="500" height="500"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const canvas = ref(null);
const ctx = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);

const handleMouseMove = (event) => {
  mouseX.value = event.clientX - canvas.value.getBoundingClientRect().left;
  mouseY.value = event.clientY - canvas.value.getBoundingClientRect().top;
  draw();
};

const draw = () => {
  if (!ctx.value) return;

  // Clear the canvas
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // Draw the background rectangle with a color
  ctx.value.fillStyle = 'lightblue'; // Adjust the color as needed
  ctx.value.fillRect(100, 100, 100, 300); // Adjust the rectangle's position and size as needed
  ctx.value.fillRect(200, 200, 100, 300); // Adjust the rectangle's position and size as needed

  // Create the gradient
  const gradient = ctx.value.createRadialGradient(
    mouseX.value,
    mouseY.value,
    0,
    mouseX.value,
    mouseY.value,
    100
  );
  gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

  // Clip the gradient within the rectangle
  ctx.value.save();
  ctx.value.beginPath();
  ctx.value.rect(100, 100, 100, 300); // Adjust the rectangle's position and size as needed
  ctx.value.rect(200, 200, 100, 300); // Adjust the rectangle's position and size as needed
  ctx.value.clip();

  // Apply the gradient
  ctx.value.fillStyle = gradient;
  ctx.value.fillRect(0, 0, 500, 500);
  ctx.value.restore();
};

onMounted(() => {
  ctx.value = canvas.value.getContext('2d');
  draw();
});
</script>

<style scoped>
canvas {
  border: 1px solid black;
}
</style>
