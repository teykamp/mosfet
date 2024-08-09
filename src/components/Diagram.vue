<template>
  <!-- <Chart :points="circuit.devices.mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="circuit.devices.mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% Saturated Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" /> -->
    <div>
      <div>M1_gate: {{ toSiPrefix(circuit.nodes["M1_gate"].value.voltage, "V") }}</div>
      <!-- <div>M1_drain: {{ toSiPrefix(circuit.nodes["M1_drain"].value.voltage, "V") }}</div> -->
      <!-- <div>M2_gate: {{ toSiPrefix(circuit.nodes["M2_gate"].value.voltage, "V") }}</div> -->
      <!-- <div>M2_drain: {{ toSiPrefix(circuit.nodes["M2_drain"].value.voltage, "V") }}</div> -->
      <!-- <div>Mb_gate: {{ toSiPrefix(circuit.nodes["Mb_gate"].value.voltage, "V") }}</div> -->
      <!-- <div>Vnode: {{ toSiPrefix(circuit.nodes["Vnode"].value.voltage, "V") }}</div> -->
    </div>
  <canvas ref="canvas" :width="canvasSize.x" :height="canvasSize.y" @mousedown="checkDrag"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Visibility, RelativeDirection, Mosfet, AngleSlider } from '../types'
import Chart from '../components/Chart.vue'

import { toRadians, modulo, between } from '../functions/extraMath'
import { toSiPrefix } from '../functions/toSiPrefix'
import { makeMosfet, getMosfetCurrent, getMosfetSaturationLevel, getMosfetForwardCurrent, makeTransformParameters } from '../functions/makeMosfet'
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { canvasSize } from '../constants'
import { drawMosfet, drawSchematic, drawVoltageSource, drawGnd, drawVdd } from '../functions/drawMosfet'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
let startTime = 0
let previousTime = 0

// const circuit = circuits["pMosSingle"]
const circuit = circuits["nMosDiffPair"]

const updateSlidersBasedOnNodeVoltages = () => {
  Object.values(circuit.devices.mosfets).forEach((mosfet) => {
    mosfet.current = getMosfetCurrent(mosfet)
    mosfet.saturationLevel = getMosfetSaturationLevel(mosfet)
    mosfet.forwardCurrent = getMosfetForwardCurrent(mosfet)

    mosfet.vgs.value = mosfet.Vg.value.voltage - mosfet.Vs.value.voltage
    mosfet.vds.value = mosfet.Vd.value.voltage - mosfet.Vs.value.voltage
  })
  Object.values(circuit.devices.voltageSources).forEach((voltageSource) => {
    voltageSource.voltageDrop.value = voltageSource.vplus.value.voltage - voltageSource.vminus.value.voltage
  })

  // const sliders = [mosfet.vgs, mosfet.vds] // for some reason, we can't put this definition inline on the next line
  circuit.allSliders.forEach((slider) => {
    slider.value = between(slider.minValue, slider.maxValue, slider.value)

    const normalizedSliderValue = slider.value / (slider.maxValue - slider.minValue) + slider.minValue
    if (slider.CCW) {
      const sliderAngle = normalizedSliderValue * (slider.endAngle - slider.startAngle) + slider.startAngle
      slider.location = {
        x: slider.center.x + slider.radius * Math.cos(sliderAngle),
        y: slider.center.y + slider.radius * Math.sin(sliderAngle),
      }
    } else {
      const sliderAngle = normalizedSliderValue * modulo((2 * Math.PI - (slider.startAngle - slider.endAngle)), 2 * Math.PI) + slider.startAngle
      slider.location = {
        x: slider.center.x + slider.radius * Math.cos(sliderAngle),
        y: slider.center.y + slider.radius * Math.sin(sliderAngle),
      }
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
  circuit.allSliders.forEach(slider => {
      if (slider.visibility == Visibility.Visible) {
          const mouseRadiusSquared = (mouseX - slider.center.x) ** 2 + (mouseY - slider.center.y) ** 2
          const mouseTheta = Math.atan2(mouseY - slider.center.y, mouseX - slider.center.x)
          const sliderValue = normalizeAngle(mouseTheta, slider.startAngle, slider.endAngle, slider.CCW).value
        if (
          (((mouseX - slider.location.x) ** 2 + (mouseY - slider.location.y) ** 2) <= 10 ** 2) || // mouse hovering over slider knob
          (((slider.radius - 20) ** 2 < mouseRadiusSquared) && (mouseRadiusSquared < (slider.radius + 20) ** 2) && (0 < sliderValue && sliderValue < 1)) // mouse hovering over slider arc
        ) {
          slider.dragging = true
          drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another mouseEvent to start dragging) (for click w/o drag)
        }
      }
    })
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', mouseUp)
}

const drag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  circuit.allSliders.forEach(slider => {
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
    // evaluate mosfet sliders
    Object.values(circuit.devices.mosfets).forEach(mosfet => {
      if (mosfet.vgs.dragging) {
        mosfet.Vg.value.fixed = true
        mosfet.Vg.value.voltage = mosfet.Vs.value.voltage + mosfet.vgs.value
      }
      if (mosfet.vds.dragging) {
        mosfet.Vd.value.fixed = true
        mosfet.Vd.value.voltage = mosfet.Vs.value.voltage + mosfet.vds.value
      }
    })
    // evaluate voltageSource sliders
    Object.values(circuit.devices.voltageSources).forEach(voltageSource => {
      if (voltageSource.voltageDrop.dragging) {
        if (voltageSource.fixedAt == 'gnd') {
          voltageSource.vplus.value.fixed = true
          voltageSource.vplus.value.voltage = voltageSource.vminus.value.voltage + voltageSource.voltageDrop.value
        }
        else if (voltageSource.fixedAt == 'vdd') {
          voltageSource.vminus.value.fixed = true
          voltageSource.vminus.value.voltage = voltageSource.vplus.value.voltage - voltageSource.voltageDrop.value
        }
      }
    })
}

const mouseUp = () => {
  Object.values(circuit.devices.mosfets).forEach(mosfet => {
    mosfet.vgs.dragging = false
    mosfet.vds.dragging = false
    mosfet.Vg.value.fixed = false
    mosfet.Vd.value.fixed = false
  })
  Object.values(circuit.devices.voltageSources).forEach(voltageSource => {
    voltageSource.voltageDrop.dragging = false
    if (voltageSource.fixedAt == 'gnd') {
      voltageSource.vminus.value.fixed = true
      voltageSource.vplus.value.fixed = false
    }
    else if (voltageSource.fixedAt == 'vdd') {
      voltageSource.vminus.value.fixed = false
      voltageSource.vplus.value.fixed = true
    }
  })

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', mouseUp)
}

const draw = () => {
  if (!ctx.value || !canvas.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  updateSlidersBasedOnNodeVoltages()
  Object.values(circuit.devices.mosfets).forEach(mosfet => {
    drawMosfet(ctx.value as CanvasRenderingContext2D, mosfet)
  })
  Object.values(circuit.devices.voltageSources).forEach(voltageSource => {
    drawVoltageSource(ctx.value as CanvasRenderingContext2D, voltageSource)
  })

  drawSchematic(ctx.value as CanvasRenderingContext2D, circuit)
}

const animate = (timestamp: number) => {
  const timeDifference = timestamp - previousTime
  previousTime = timestamp
  incrementCircuit(circuit)

  Object.values(circuit.devices.mosfets).forEach(mosfet => {
    // 10 mA -> speed of 3
    // 1 mA -> speed of 2
    // 100 uA -> speed of 1 // unityCurrent
    // 10 uA -> speed of 1/4
    // 1 uA -> speed of 1/9
    // 100nA -> speed of 1/16
    const unityCurrent = 1e-4 // Amps
    const unitySpeed = 50 // px / s
    let dotSpeed = unitySpeed
    if (mosfet.current > unityCurrent) {
      dotSpeed = (Math.log10(mosfet.current / unityCurrent) + 1) ** 2 * unitySpeed
    } else {
      dotSpeed = 1 / (1 - Math.log10(mosfet.current / unityCurrent)) ** 2 * unitySpeed
    }
    if (dotSpeed > 5 * unitySpeed) {
      dotSpeed = 5 * unitySpeed
    }
    else if (dotSpeed < 0.001 * unitySpeed) {
      dotSpeed = 0.001 * unitySpeed
    }

    mosfet.dots[0].y += dotSpeed * (timeDifference / 1000)
    mosfet.dots.forEach((dot, index) => {
      dot.y = modulo(mosfet.dots[0].y - mosfet.originY + 60 + index * 20, 120) + mosfet.originY - 60
    })
  })

  draw()
  requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    draw()
    requestAnimationFrame(animate)

  }
})
</script>

<style scoped>
canvas {
  border: 1px solid black;
}
</style>
