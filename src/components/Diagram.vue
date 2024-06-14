<template>
  <canvas ref="canvas" width="500" height="500"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
const dots = ref([
  {x: 360, y: 0},
  {x: 360, y: 10},
  {x: 360, y: 20},
  {x: 360, y: 30},
  {x: 360, y: 40},
  {x: 360, y: 50},
  {x: 360, y: 60},
  {x: 360, y: 70},
  {x: 360, y: 80},
  {x: 360, y: 90}
])

const drawLine = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, thickness: number = 5, fill: boolean = true) => {
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  if (width === 0) {
    // Vertical line
    const x = startX - thickness / 2
    const y = Math.min(startY, endY)
    fill ? ctx.fillRect(x, y, thickness, height) : ctx.rect(x, y, thickness, height)
  } else if (height === 0) {
    // Horizontal line
    const x = Math.min(startX, endX)
    const y = startY - thickness / 2
    fill ? ctx.fillRect(x, y, width, thickness) : ctx.rect(x, y, width, thickness)
  }
}

const drawMosfet = (ctx: CanvasRenderingContext2D ,originX: number, originY: number, gradientSize: number = 100) => {
  ctx.fillStyle = 'lightblue'
  drawLine(ctx, originX, originY + 17, originX, originY + 60)
  drawLine(ctx, originX, originY + 20, originX + 30, originY + 20)
  drawLine(ctx, originX, originY - 17, originX, originY - 60)
  drawLine(ctx, originX, originY - 20, originX + 30, originY - 20)
  drawLine(ctx, originX + 30, originY + 40, originX + 30, originY - 40)
  drawLine(ctx, originX + 40, originY + 30, originX + 40, originY - 30)
  drawLine(ctx, originX + 40, originY, originX + 60, originY)

  const gradient = ctx.createRadialGradient(originX, originY - 60, 0, originX, originY - 60, gradientSize)

  gradient.addColorStop(0, 'rgba(255, 0, 0, 1)')
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')

  ctx.save()
  ctx.beginPath()
  drawLine(ctx, originX, originY + 17, originX, originY + 60, undefined, false)
  drawLine(ctx, originX, originY + 20, originX + 30, originY + 20, undefined, false)
  drawLine(ctx, originX, originY - 17, originX, originY - 60, undefined, false)
  drawLine(ctx, originX, originY - 20, originX + 30, originY - 20, undefined, false)
  drawLine(ctx, originX + 30, originY + 40, originX + 30, originY - 40, undefined, false)
  ctx.clip()

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 500, 500)
  ctx.restore()

  // Draw the animated dots
  ctx.fillStyle = 'blue'
  dots.value.forEach(dot => {
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

const draw = () => {
  if (!ctx.value || !canvas.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

  
  drawMosfet(ctx.value, 100, 100)
}

const animate = () => {
  dots.value.forEach(dot => {
    dot.y += 1
    if (dot.y > 100) {
      dot.y = 0
    }
  })

  draw()
  requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    draw()
    animate()
  }
})
</script>

<style scoped>
canvas {
  border: 1px solid black;
}
</style>
