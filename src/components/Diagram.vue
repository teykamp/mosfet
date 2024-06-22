<template>
  <Chart :points="mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% of Max. Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" />
  <canvas ref="canvas" width="500" height="500" @mousedown="checkDrag"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import type { Point } from '../types'
import { unit } from 'mathjs'
import { ekvNmos } from '../functions/ekvModel'
import Chart from '../components/Chart.vue'
import { toRadians, linspace, modulo } from '../functions/extraMath'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)

const generateCurrent = () => {
  const currents: Point[] = []
  const vgs = linspace(0, 1, 1000);
  const current = vgs.map(n => ekvNmos(unit(n, 'V'), unit(0, 'V')).I)
  for (let i = 0; i < current.length; i++) {
    currents.push({
      x: vgs[i],
      y: current[i].toNumber('A')
    })
  }
  return currents
}

type AngleSlider = {
    dragging: boolean
    location: {
      x: number,
      y: number,
    },
    radius: number,
    center: {
      x: number,
      y: number,
    },
    startAngle: number,
    endAngle: number,
    CCW: boolean,
    data: Point[]
}

type Mosfet = {
  originX: number,
  originY: number,
  gradientSize: number,
  dots: Point[]
  vgs: AngleSlider,
  vds: AngleSlider,
}

const makeAngleSlider = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean): AngleSlider => {
  return {
    dragging: false,
    location: {
      x: Math.cos(startAngle) * radius + centerX,
      y: Math.sin(startAngle) * radius + centerY,
    },
    center: {x: centerX, y: centerY},
    radius: radius,
    startAngle: startAngle,
    endAngle: endAngle,
    CCW: CCW,
    data: generateCurrent()
  }
}

const makeMosfet = (originX: number, originY: number): Mosfet => {
  return {
    originX: originX,
    originY: originY,
    gradientSize: 100,
    dots: [
      { x: originX - 10, y: originY - 60 },
      { x: originX - 10, y: originY - 40 },
      { x: originX - 10, y: originY - 20 },
      { x: originX - 10, y: originY      },
      { x: originX - 10, y: originY + 20 },
      { x: originX - 10, y: originY + 40 },
    ],
    vgs: makeAngleSlider(originX, originY, 80, toRadians(85), toRadians(5), true),
    vds: makeAngleSlider(originX, originY, 80, toRadians(110), toRadians(-110), false),
  }
}

const mosfets = reactive<Mosfet[]>([])

mosfets.push(makeMosfet(100, 100), makeMosfet(400, 400))

const generateSaturationLevel = (currents: Point[]) => {
  const saturationLevels: Point[] = []
  const vds = linspace(0, 1, 1000);
  const saturationLevel = vds.map(n => ekvNmos(unit(1, 'V'), unit(0, 'V'), unit(n, 'V')).saturationLevel * 100) // to percent
  for (let i = 0; i < vds.length; i++) { // used to be current.length from above
    saturationLevels.push({
      x: currents[i].x,
      y: saturationLevel[i]
    })
  }

  return saturationLevels
}

const normalizeAngle = (angle: number, startAngle: number, endAngle: number, CCW: boolean) => {
  const angleSpan = modulo(CCW ? startAngle - endAngle : endAngle - startAngle, 2 * Math.PI)

  // subtract out the starting angle so what was once the starting angle is now considered zero.
  // mod by 2pi so that angles just to the left of the starting angle are considered to be +2pi;
  // angles just to the right of the starting angle are considered close to zero;
  // and angles about opposite from the starting angle are about +pi.
  const normalizedAngle = modulo(CCW ? startAngle - angle : angle - startAngle, 2 * Math.PI)

  // default case: the angle is in between the starting and ending angles.
  let returnAngle = angle
  // calculate the value of the slider as the fraction of the way between the start and end angles
  let value = normalizedAngle / Math.abs(angleSpan)

  // if the angle is outside the bounds of [0, angleSpan], then
  // check whether the angle is closer to the starting angle or closer to the ending angle
  if (normalizedAngle > Math.PI + angleSpan / 2) {
    returnAngle = startAngle
    value = 0
  }
  else if (normalizedAngle > angleSpan) {
    returnAngle = endAngle
    value = 1
  }

  return {
    returnAngle,
    value
  }
}

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
    [mosfet.vds, mosfet.vgs].forEach(slider => {
      const mouseRadiusSquared = (mouseX - slider.center.x) ** 2 + (mouseY - slider.center.y) ** 2
      const mouseTheta = Math.atan2(mouseY - slider.center.y, mouseX - slider.center.x)
      const sliderValue = normalizeAngle(mouseTheta, slider.startAngle, slider.endAngle, slider.CCW).value
      if (
        (((mouseX - slider.location.x) ** 2 + (mouseY - slider.location.y) ** 2) <= 10 ** 2) ||
        (((slider.radius - 20) ** 2 < mouseRadiusSquared) && (mouseRadiusSquared < (slider.radius + 20) ** 2) && (0 < sliderValue && sliderValue < 1))
      ) {
        slider.dragging = true
        drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another mouseEvent to start dragging)
      }
    })
  })
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', mouseUp)
}

const drag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  const radius = 80

  mosfets.forEach(mosfet => {
    if (mosfet.vgs.dragging) {
      const mouseAngle = normalizeAngle(
        Math.atan2(mouseY - mosfet.originY, mouseX - mosfet.originX),
        mosfet.vgs.startAngle,
        mosfet.vgs.endAngle,
        mosfet.vgs.CCW
      ).returnAngle

      mosfet.vgs.location = {
        x: Math.cos(mouseAngle) * radius + mosfet.originX,
        y: Math.sin(mouseAngle) * radius + mosfet.originY
      }
    }

    else if (mosfet.vds.dragging) {
      const mouseAngle = normalizeAngle(
              Math.atan2(mouseY - mosfet.originY, mouseX - mosfet.originX),
              mosfet.vds.startAngle,
              mosfet.vds.endAngle,
              mosfet.vds.CCW
      ).returnAngle

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

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', mouseUp)
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

const drawAngleSlider = (ctx: CanvasRenderingContext2D, state: Pick<Mosfet, 'vgs'>['vgs'] | Pick<Mosfet, 'vds'>['vds']) => {
  // draw slider path
  ctx.strokeStyle = 'orange'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(state.center.x, state.center.y, state.radius, state.startAngle, state.endAngle, state.CCW)
  ctx.stroke()

  // draw draggable slider circle
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
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vgs)
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vds)
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
