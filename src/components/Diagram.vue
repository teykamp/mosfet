<template>
  <canvas ref="canvas" @mousemove="handleMouseMove" width="500" height="500"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvas = ref(null)
const ctx = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (event) => {
  mouseX.value = event.clientX - canvas.value.getBoundingClientRect().left
  mouseY.value = event.clientY - canvas.value.getBoundingClientRect().top
  draw()
}

const draw = () => {
  if (!ctx.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

  ctx.value.fillStyle = 'lightblue' 
  ctx.value.fillRect(100, 100, 5, 40)
  ctx.value.fillRect(100, 140, 40, 5)
  ctx.value.fillRect(100, 180, 5, 40)
  ctx.value.fillRect(100, 180, 40, 5)
  ctx.value.fillRect(140, 120, 5, 80)
  ctx.value.fillRect(160, 140, 5, 45)
  ctx.value.fillRect(160, 160, 40, 5)

  const gradient = ctx.value.createRadialGradient(
    mouseX.value,
    mouseY.value,
    0,
    mouseX.value,
    mouseY.value,
    100
  )
  gradient.addColorStop(0, 'rgba(255, 0, 0, 1)')
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')

  ctx.value.save()
  ctx.value.beginPath()
  ctx.value.rect(100, 100, 5, 40)
  ctx.value.rect(100, 140, 40, 5)
  ctx.value.rect(100, 180, 5, 40)
  ctx.value.rect(100, 180, 40, 5)
  ctx.value.rect(140, 120, 5, 80)
  ctx.value.clip()

  ctx.value.fillStyle = gradient
  ctx.value.fillRect(0, 0, 500, 500)
  ctx.value.restore()
}

onMounted(() => {
  ctx.value = canvas.value.getContext('2d')
  draw()
})
</script>

<style scoped>
canvas {
  border: 1px solid black
}
</style>
