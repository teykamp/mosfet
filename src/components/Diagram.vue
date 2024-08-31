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
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { canvasSize } from '../constants'
import { AngleSlider } from '../classes/angleSlider'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
let previousTimestamp = 0

type DefinedCircuits = keyof typeof circuits
const currentCircuit = ref<DefinedCircuits>('nMos5TransistorOpAmp')
const circuitsToChooseFrom = Object.keys(circuits) as DefinedCircuits[]

const circuit = shallowRef(circuits[currentCircuit.value])

const setCircuit = (newCircuit: DefinedCircuits) => {
  currentCircuit.value = newCircuit
  circuit.value = circuits[newCircuit]
}

const updateSlidersBasedOnNodeVoltages = () => {
  circuit.value.allSliders.forEach((slider: AngleSlider) => {
    slider.updateSliderBasedOnNodeVoltages()
  })
}

const updateNodeVoltagesBasedOnSliders = () => {
  circuit.value.allSliders.forEach((slider: AngleSlider) => {
    slider.updateNodeVoltagesBasedOnSlider()
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
      slider.checkDrag({x: mouseX, y: mouseY}, event.button == 1)
  })

  drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another mouseEvent to start dragging) (for click w/o drag)
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
    slider.dragSlider({x: mouseX, y: mouseY})
  })

  updateNodeVoltagesBasedOnSliders()
}

const mouseUp = () => {
  circuit.value.allSliders.forEach((slider) => {
    slider.releaseSlider()
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
  const timeDifference = timestamp - previousTimestamp
  previousTimestamp = timestamp

  circuit.value.allSliders.forEach((slider) => {
    slider.adjustPreciseSlider(timeDifference)
    updateNodeVoltagesBasedOnSliders()
  })

  incrementCircuit(circuit.value, timeDifference)

  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
    mosfet.currentDots.updateDotPositionBasedOnTimestamp(mosfet.current, timeDifference)
  })
  Object.values(circuit.value.schematic.parasiticCapacitors).forEach(capacitor => {
    capacitor.currentDots.updateDotPositionBasedOnTimestamp(capacitor.node.value.netCurrent, timeDifference)
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
