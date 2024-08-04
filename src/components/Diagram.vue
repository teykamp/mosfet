<template>
  <Chart :points="mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% Saturated Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" />
  <canvas ref="canvas" width="500" height="500" @mousedown="checkDrag"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Visibility, RelativeDirection, Mosfet, AngleSlider } from '../types'
import Chart from '../components/Chart.vue'
import { toRadians, modulo } from '../functions/extraMath'
import { toSiPrefix } from '../functions/toSiPrefix'
import { makeMosfet, getMosfetCurrent, getMosfetSaturationLevel } from '../functions/makeMosfet'
import { incrementCircuit } from '../functions/incrementCircuit'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
let startTime = undefined

const nodes: Node[] = [
  ref({voltage: 1, netCurrent: 0, capacitance: 1, fixed: false}),
  ref({voltage: 0, netCurrent: 0, capacitance: 1, fixed: false}),
  ref({voltage: 5, netCurrent: 0, capacitance: 1, fixed: false}),
  ref({voltage: 0, netCurrent: 0, capacitance: 1, fixed: false}),
]

const mosfets: Mosfet[] = []
mosfets.push(
  makeMosfet(
    0,
    0,
    nodes[0],
    nodes[1],
    nodes[2],
    nodes[3],
  ),
  makeMosfet(
    5,
    5,
    nodes[0],
    nodes[1],
    nodes[2],
    nodes[3],
  ),
)

const updateMosfetBasedOnNodeVoltages = (mosfet: Mosfet) => {
  mosfet.current = getMosfetCurrent(mosfet)
  mosfet.saturationLevel = getMosfetSaturationLevel(mosfet)

  mosfet.vgs.value = mosfet.Vg.value.voltage - mosfet.Vs.value.voltage
  mosfet.vds.value = mosfet.Vd.value.voltage - mosfet.Vs.value.voltage

  const sliders = [mosfet.vgs, mosfet.vds] // for some reason, we can't put this definition inline on the next line
  sliders.forEach((slider) => {
    if (slider.value > slider.maxValue) {
      slider.value = slider.maxValue
    }
    else if (slider.value < slider.minValue) {
      slider.value = slider.minValue
    }
    const normalizedSliderValue = slider.value / (slider.maxValue - slider.minValue) + slider.minValue
    const sliderAngle = normalizedSliderValue * (slider.endAngle - slider.startAngle) + slider.startAngle
    slider.location = {
      x: slider.center.x + slider.radius * Math.cos(sliderAngle),
      y: slider.center.y + slider.radius * Math.sin(sliderAngle),
    }
  })
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
      if (slider.visibility == Visibility.Visible) {
          const mouseRadiusSquared = (mouseX - slider.center.x) ** 2 + (mouseY - slider.center.y) ** 2
          const mouseTheta = Math.atan2(mouseY - slider.center.y, mouseX - slider.center.x)
          const sliderValue = normalizeAngle(mouseTheta, slider.startAngle, slider.endAngle, slider.CCW).value
        if (
          (((mouseX - slider.location.x) ** 2 + (mouseY - slider.location.y) ** 2) <= 10 ** 2) || // mouse hovering over slider knob
          (((slider.radius - 20) ** 2 < mouseRadiusSquared) && (mouseRadiusSquared < (slider.radius + 20) ** 2) && (0 < sliderValue && sliderValue < 1)) // mouse hovering over slider arc
        ) {
          slider.dragging = true
          drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another mouseEvent to start dragging)
        }
      }
    })
  })
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', mouseUp)
}

const drag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  mosfets.forEach(mosfet => {
    [mosfet.vgs, mosfet.vds].forEach(slider => {
      if (slider.dragging) {
        const result = normalizeAngle(
          Math.atan2(mouseY - slider.center.y, mouseX - slider.center.x),
          slider.startAngle,
          slider.endAngle,
          slider.CCW
        )
        const mouseAngle = result.returnAngle
        slider.value = result.value * (slider.maxValue - slider.minValue) + slider.minValue

        slider.location = {
          x: Math.cos(mouseAngle) * slider.radius + slider.center.x,
          y: Math.sin(mouseAngle) * slider.radius + slider.center.y
        }
      }
    })
    if (mosfet.vgs.dragging) {
      mosfet.Vg.value.fixed = true
      mosfet.Vg.value.voltage = mosfet.Vs.value.voltage + mosfet.vgs.value
    }
    if (mosfet.vds.dragging) {
      mosfet.Vd.value.fixed = true
      mosfet.Vd.value.voltage = mosfet.Vs.value.voltage + mosfet.vds.value
    }
  })
}

const mouseUp = () => {
  mosfets.forEach(mosfet => {
    mosfet.vgs.dragging = false
    mosfet.vds.dragging = false
    mosfet.Vg.value.fixed = false
    mosfet.Vd.value.fixed = false
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

const drawAngleSlider = (ctx: CanvasRenderingContext2D, slider: Pick<Mosfet, 'vgs'>['vgs'] | Pick<Mosfet, 'vds'>['vds']) => {
  if (slider.visibility == Visibility.Hidden) {
    return
  }

  // draw slider path
  ctx.strokeStyle = slider.visibility == Visibility.Visible ? 'orange' : 'lightgrey'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(slider.center.x, slider.center.y, slider.radius, slider.startAngle, slider.endAngle, slider.CCW)

  // draw tail flourish on slider path
  const tailSize = 7
  ctx.moveTo(slider.center.x + (slider.radius + tailSize) * Math.cos(slider.startAngle), slider.center.y + (slider.radius + tailSize) * Math.sin(slider.startAngle))
  ctx.lineTo(slider.center.x + (slider.radius - tailSize) * Math.cos(slider.startAngle), slider.center.y + (slider.radius - tailSize) * Math.sin(slider.startAngle))

  // draw head flourish on slider path
  const headSize = 7
  const headDirection = slider.CCW ? 1 : -1
  const headAngle = headDirection * toRadians(5)
  ctx.moveTo(slider.center.x + (slider.radius + headSize) * Math.cos(slider.endAngle + headAngle), slider.center.y + (slider.radius + headSize) * Math.sin(slider.endAngle + headAngle))
  ctx.lineTo(slider.center.x + (slider.radius           ) * Math.cos(slider.endAngle            ), slider.center.y + (slider.radius           ) * Math.sin(slider.endAngle            ))
  ctx.lineTo(slider.center.x + (slider.radius - headSize) * Math.cos(slider.endAngle + headAngle), slider.center.y + (slider.radius - headSize) * Math.sin(slider.endAngle + headAngle))
  ctx.stroke()

  // draw draggable slider circle
  ctx.beginPath()
  ctx.arc(slider.location.x, slider.location.y, 5, 0, Math.PI * 2)
  ctx.fillStyle = slider.visibility == Visibility.Visible ? 'rgb(255, 0, 0)' : 'lightgrey'
  ctx.fill()

  ctx.fillStyle = slider.visibility == Visibility.Visible ? '#000' : 'lightgrey'
  ctx.font = '16px Arial'
  if (slider.displayTextLocation == RelativeDirection.Right) {
    ctx.fillText(slider.displayText, slider.location.x + 10, slider.location.y)
    ctx.font = '14px Arial'
    ctx.fillText(toSiPrefix(slider.value, 'V', 3), slider.location.x + 10, slider.location.y + 15)
  } else {
    ctx.fillText(slider.displayText, slider.location.x - 40, slider.location.y)
    ctx.font = '14px Arial'
    ctx.fillText(toSiPrefix(slider.value, 'V', 3), slider.location.x - 40, slider.location.y + 15)
  }
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
    updateMosfetBasedOnNodeVoltages(mosfet) // new line here!!!
    drawMosfet(ctx.value as CanvasRenderingContext2D, mosfet.originX, mosfet.originY, mosfet.gradientSize, mosfet.dots)
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vgs)
    drawAngleSlider(ctx.value as CanvasRenderingContext2D, mosfet.vds)
  })
}

const animate = (timestamp) => {
  if (startTime === undefined) {
    startTime = timestamp
  }
  const elapsedTime = timestamp - startTime
  // TODO: use elapsed time to compute dot movement

  mosfets.forEach(mosfet => {
    // 100 mA -> speed of 3
    // 10 mA -> speed of 2
    // 1 mA -> speed of 1
    // 100 uA -> speed of 1/2
    // 10 uA -> speed of 1/3
    // 1 uA -> speed of 1/4
    let dotSpeed = Math.log10(mosfet.current / 0.001) + 1
    if (dotSpeed < 1) {
      dotSpeed = 1 / (2 - dotSpeed)
    }
    if (dotSpeed > 5) {
      dotSpeed = 5
    }
    else if (dotSpeed < 0.01) {
      dotSpeed = 0.01
    }
    mosfet.dots.forEach(dot => {
      dot.y += dotSpeed
      if (dot.y > mosfet.originY + 60) {
        dot.y = mosfet.originY - 60
      }
    })
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
