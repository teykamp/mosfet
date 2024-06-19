<template>
  <canvas ref="canvas" width="500" height="500" @mousedown="checkDrag" @mousemove="drag" @mouseup="mouseUp"></canvas>
  <!-- {{ ((Math.atan2(mosfets[0].vgs.location.x, mosfets[0].vgs.location.y) * 180 / Math.PI - 29) / 32* 5).toFixed(0) }} -->
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import type { Point } from '../types'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)

type Mosfet = {
  originX: number,
  originY: number,
  gradientSize: number,
  dots: Point[]
  vgs: {
    dragging: boolean
    location: {
      x: number,
      y: number,
    },
    startAngle: number,
    angle: number,
  },
  vds: {
    dragging: boolean
    location: {
      x: number,
      y: number,
    },
    startAngle: number,
    angle: number,
  },
}


const mosfets = reactive<Mosfet[]>([])

mosfets.push({
  originX: 100,
  originY: 100,
  gradientSize: 100,
  dots: [
    { x: 90, y: 40 },
    { x: 90, y: 60 },
    { x: 90, y: 80 },
    { x: 90, y: 100 },
    { x: 90, y: 120 },
    { x: 90, y: 140 },
  ],
  vgs: {
    dragging: false,
    location: {
      x: Math.cos(85 * Math.PI / 180) * 80 + 100,
      y: Math.sin(85 * Math.PI / 180) * 80 + 100,
    },
    startAngle: 5,
    angle: 80,
  },
  vds: {
    dragging: false,
    location: {
      x: Math.cos(110 * Math.PI / 180) * 80 + 100,
      y: Math.sin(110 * Math.PI / 180) * 80 + 100,
    },
    startAngle: 110,
    angle: 140,
  },
})

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  return { mouseX, mouseY }
}

const checkDrag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  mosfets.forEach(mosfet => {
    if (((mouseX - mosfet.vgs.location.x) ** 2 + (mouseY - mosfet.vgs.location.y) ** 2) <= 10 ** 2) mosfet.vgs.dragging = true
    if (((mouseX - mosfet.vds.location.x) ** 2 + (mouseY - mosfet.vds.location.y) ** 2) <= 10 ** 2) mosfet.vds.dragging = true
  })
}

const normalizeAngle = (angle: number) => {
  while (angle < 0) {
    angle += 2 * Math.PI
  }
  while (angle >= 2 * Math.PI) {
    angle -= 2 * Math.PI
  }
  return angle
}

const drag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  const radius = 80

  mosfets.forEach(mosfet => {
    if (mosfet.vgs.dragging) {
      const mouseAngle = Math.max(Math.min(normalizeAngle(Math.atan2(mouseY - mosfet.originY, mouseX - mosfet.originX)), (mosfet.vgs.angle + mosfet.vgs.startAngle) * Math.PI / 180), mosfet.vgs.startAngle * Math.PI / 180)

      mosfet.vgs.location = {
        x: Math.cos(mouseAngle) * radius + mosfet.originX,
        y: Math.sin(mouseAngle) * radius + mosfet.originY
      }
    }

    if (mosfet.vds.dragging) {
      const mouseAngle = Math.max(Math.min(normalizeAngle(Math.atan2(mouseY - mosfet.originY, mouseX - mosfet.originX)), (mosfet.vds.angle + mosfet.vds.startAngle) * Math.PI / 180), mosfet.vds.startAngle * Math.PI / 180)

      mosfet.vds.location = {
        x: Math.cos(mouseAngle) * radius + mosfet.originX,
        y: Math.sin(mouseAngle) * radius + mosfet.originY
      }
    }
  })

}

const mouseUp = () => {
  mosfets.forEach(mosfet => {
    mosfet.vgs.dragging = false
    mosfet.vds.dragging = false
  })
}

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

const drawAngleSlider = (ctx: CanvasRenderingContext2D, state: Pick<Mosfet, 'vgs'>['vgs'] | Pick<Mosfet, 'vds'>['vds'], angle: number, startAngle: number, radius: number, centerX: number, centerY: number) => {
  const points: Point[] = []
  const increment = angle / (angle < 360 ? angle : 360)

  for (let i = startAngle; i <= angle + startAngle; i += increment) {
    const radian = i * (Math.PI / 180)
    const x = centerX + radius * Math.cos(radian)
    const y = centerY + radius * Math.sin(radian)
    points.push({ x, y });
  }
  ctx.strokeStyle = 'orange'
  ctx.lineWidth = 5
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(state.location.x, state.location.y, 5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgb(255, 0, 0)'
  ctx.fill()
}


const drawMosfet = (ctx: CanvasRenderingContext2D, originX: number, originY: number, gradientSize: number = 100, dots: {x: number, y: number}[]) => { 
  // TODO: should porbably just pass mosfet in here then can draw sliders as well
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

  dots.forEach(dot => {
    ctx.fillStyle = `rgba(0, 0, 255, ${Math.abs(-0.9 + Math.abs(dot.y - originY) / 100)})`
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })

}

const draw = () => {
  if (!ctx.value || !canvas.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  mosfets.forEach(mosfet => {
    drawMosfet(ctx.value as CanvasRenderingContext2D, mosfet.originX, mosfet.originY, mosfet.gradientSize, mosfet.dots)
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vgs, mosfet.vgs.angle, mosfet.vgs.startAngle, 80, mosfet.originX, mosfet.originY)
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vds, mosfet.vds.angle, mosfet.vds.startAngle, 80, mosfet.originX, mosfet.originY)
  })
}

const animate = () => {
  mosfets.forEach(mosfet => mosfet.dots.forEach(dot => {
    dot.y += 1
    if (dot.y > mosfet.originY + 60) {
      dot.y = mosfet.originY - 60
    }
  }))

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
