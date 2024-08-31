<template>
  <!-- <Chart :points="circuit.devices.mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="circuit.devices.mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% Saturated Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" /> -->
  <div style="display: flex; justify-content: space-between; padding: 50px;">
    <div style="display: flex; flex-direction: column;">
      <button
        v-for="circuit in circuitsToChooseFrom"
        @click="setCircuit(circuit)"
        :style="`margin-bottom: 10px; background-color: ${circuit === currentCircuit ? 'rgb(200, 200, 200)' : ''};`"
      >{{ circuit }}</button>
    </div>
    <div>
      <h1 style="margin-top: -50px;">
        {{currentCircuit}}
      </h1>
      <canvas ref="canvas" :width="canvasSize.x" :height="canvasSize.y" @mousedown="checkDrag" style=" margin-right: 5%;"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { Visibility } from '../types'
import { between } from '../functions/extraMath'
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { canvasSize, preciseSliderTickRange } from '../constants'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)

type DefinedCircuits = keyof typeof circuits
const currentCircuit = ref<DefinedCircuits>('nMos5TransistorOpAmp')
const circuitsToChooseFrom = Object.keys(circuits) as DefinedCircuits[]

const circuit = shallowRef(circuits[currentCircuit.value])

const setCircuit = (newCircuit: DefinedCircuits) => {
  currentCircuit.value = newCircuit
  circuit.value = circuits[newCircuit]
}

const updateSlidersBasedOnNodeVoltages = () => {
  Object.values(circuit.value.devices.mosfets).forEach((mosfet) => {
    mosfet.current = mosfet.getMosfetCurrent()
    mosfet.saturationLevel = mosfet.getMosfetSaturationLevel()
    mosfet.forwardCurrent = mosfet.getMosfetForwardCurrent()

    mosfet.vgs.value = mosfet.Vg.value.voltage - mosfet.Vs.value.voltage
    mosfet.vds.value = mosfet.Vd.value.voltage - mosfet.Vs.value.voltage
  })
  Object.values(circuit.value.devices.voltageSources).forEach((voltageSource) => {
    voltageSource.voltageDrop.value = voltageSource.vplus.value.voltage - voltageSource.vminus.value.voltage
  })

  // const sliders = [mosfet.vgs, mosfet.vds] // for some reason, we can't put this definition inline on the next line
  circuit.value.allSliders.forEach((slider) => {
    slider.value = between(slider.temporaryMinValue, slider.temporaryMaxValue, slider.value)

    const normalizedSliderValue = (slider.value - slider.temporaryMinValue) / (slider.temporaryMaxValue - slider.temporaryMinValue)
      const sliderAngle = normalizedSliderValue * (slider.endAngle)
      slider.location = {
        x: slider.radius * Math.cos(sliderAngle),
        y: slider.radius * Math.sin(sliderAngle),
      }
  })
}

const updateNodeVoltagesBasedOnSliders = () => {
  // evaluate mosfet sliders
  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
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
    Object.values(circuit.value.devices.voltageSources).forEach(voltageSource => {
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

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  return { mouseX, mouseY }
}


const checkDrag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  circuit.value.allSliders.forEach(slider => {
    const transformedMousePos = slider.transformationMatrix.inverse().transformPoint({x: mouseX, y: mouseY}) // multiply(new Matrix(3, 1, [[mouseX], [mouseY], [1]]))

    if (slider.visibility == Visibility.Visible) {
        const mouseRadiusSquared = (transformedMousePos.x) ** 2 + (transformedMousePos.y) ** 2
        const mouseDistanceFromDraggableSliderSquared = (transformedMousePos.x - slider.location.x) ** 2 + (transformedMousePos.y - slider.location.y) ** 2
        const mouseTheta = Math.atan2(transformedMousePos.y, transformedMousePos.x)
        const sliderValue = mouseTheta / slider.endAngle
      if (
        (mouseDistanceFromDraggableSliderSquared <= 10 ** 2) || // mouse hovering over slider knob
        (((slider.radius - 20) ** 2 < mouseRadiusSquared) && (mouseRadiusSquared < (slider.radius + 20) ** 2) && (0 < sliderValue && sliderValue < 1)) // mouse hovering over slider arc
      ) {
        slider.dragging = true
        if (event.button == 1) {
          slider.preciseDragging = true
        }
        if (slider.preciseDragging) {
          slider.radius = slider.originalRadius + 10
        }
        // set the temporary min and max slider values
        if (slider.preciseDragging) {
          const percentValue = (slider.value - slider.minValue) / (slider.maxValue - slider.minValue)
          slider.temporaryMinValue = slider.value - preciseSliderTickRange * percentValue
          slider.temporaryMaxValue = slider.value + preciseSliderTickRange * (1 - percentValue)
        }
        else {
          slider.temporaryMinValue = slider.minValue
          slider.temporaryMaxValue = slider.maxValue
        }

        drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another mouseEvent to start dragging) (for click w/o drag)
      }
    }
  })
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', mouseUp)
}

const drag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  // reset node capacitances
  for (const nodeId in circuit.value.nodes) {
    const node = circuit.value.nodes[nodeId].value
    node.capacitance = node.originalCapacitance
  }

  // update slider values based on position
  circuit.value.allSliders.forEach(slider => {
    if (slider.dragging) {
      const transformedMousePos = slider.transformationMatrix.inverse().transformPoint({x: mouseX, y: mouseY})
      const mouseAngle = Math.atan2(transformedMousePos.y, transformedMousePos.x)

      const percentValue = between(0, 1, mouseAngle / slider.endAngle)
      slider.value = percentValue * (slider.temporaryMaxValue - slider.temporaryMinValue) + slider.temporaryMinValue

      slider.location = {
        x: Math.cos(mouseAngle) * slider.radius,
        y: Math.sin(mouseAngle) * slider.radius
      }

      if ((percentValue < 0.05) && (slider.value <= slider.previousValue)) {
        slider.valueRateOfChange = -0.01

      }
      else if ((percentValue > 0.95) && (slider.value >= slider.previousValue)) {
        slider.valueRateOfChange = 0.01
      }
      else {
        slider.valueRateOfChange = 0
      }
      slider.previousValue = slider.value
    }
  })
  updateNodeVoltagesBasedOnSliders()
}

const mouseUp = () => {
  circuit.value.allSliders.forEach((slider) => {
    slider.temporaryMinValue = slider.minValue
    slider.temporaryMaxValue = slider.maxValue
    slider.radius = slider.originalRadius
    slider.preciseDragging = false
  })

  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
    mosfet.vgs.dragging = false
    mosfet.vds.dragging = false
    mosfet.Vg.value.fixed = false
    mosfet.Vd.value.fixed = false
  })
  Object.values(circuit.value.devices.voltageSources).forEach(voltageSource => {
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

  ctx.value.resetTransform()
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  updateSlidersBasedOnNodeVoltages()
  circuit.value.draw(ctx.value as CanvasRenderingContext2D)
}

const animate = (timestamp: number) => {
  circuit.value.allSliders.forEach((slider) => {
    if (slider.dragging && slider.preciseDragging) {
      if ((slider.value >= slider.maxValue) || (slider.temporaryMaxValue > slider.maxValue)) {
        slider.value = slider.maxValue
        slider.temporaryMaxValue = slider.maxValue
        slider.temporaryMinValue = slider.maxValue - preciseSliderTickRange
        slider.valueRateOfChange = 0
      }
      else if ((slider.value <= slider.minValue) || (slider.temporaryMinValue < slider.minValue)) {
        slider.value = slider.minValue
        slider.temporaryMinValue = slider.minValue
        slider.temporaryMaxValue = slider.minValue + preciseSliderTickRange
        slider.valueRateOfChange = 0
      }
      else {
        slider.temporaryMinValue += slider.valueRateOfChange
        slider.temporaryMaxValue += slider.valueRateOfChange
        slider.value += slider.valueRateOfChange
      }
    }
    updateNodeVoltagesBasedOnSliders()
  })

  incrementCircuit(circuit.value)

  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
    mosfet.currentDots.updateDotPositionBasedOnTimestamp(timestamp, mosfet.current)
  })
  Object.values(circuit.value.schematic.parasiticCapacitors).forEach(capacitor => {
    capacitor.currentDots.updateDotPositionBasedOnTimestamp(timestamp, capacitor.node.value.netCurrent)
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
