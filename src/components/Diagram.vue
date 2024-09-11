<template>
  <!-- <Chart :points="circuit.devices.mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="circuit.devices.mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% Saturated Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" /> -->

  <div style="position: absolute; top: 10px; left: 10px;">
    <button @click.stop="showSideBar = !showSideBar">Menu</button>
  </div>

  <Transition>
    <div
      v-show="showSideBar"
      ref="sideBar"
      style="display: flex; flex-direction: column; width: 250px; height: 100vh; padding: 10px; background-color: whitesmoke; position: absolute;">
      <h3 style="text-align: center;">Circuits</h3>
      <div style="border: 1px solid grey;"></div>
      <button v-for="circuit in circuitsToChooseFrom" @click.prevent="setCircuit(circuit)"
        :style="`margin-bottom: 10px; background-color: ${circuit === currentCircuit ? 'rgb(200, 200, 200)' : ''};`">{{
        circuit }}</button>
      <button
        @click="showSideBar = false"
        style="position: absolute; bottom: 40px; right: 15px;"
      >Close</button>
    </div>
  </Transition>
  <canvas ref="canvas" :width="canvasSize.x" :height="canvasSize.y" @mousedown="checkDrag"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { canvasDpi, canvasSize } from '../constants'
import { AngleSlider } from '../classes/angleSlider'
import { Visibility } from '../types'

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
let previousTimestamp = 0

const sideBar = ref<HTMLElement | null>(null)
const showSideBar = ref(false)

const handleClickOutside = (event: MouseEvent) => {
  if (sideBar.value && !sideBar.value.contains(event.target as Node)) showSideBar.value = false
}

type DefinedCircuits = keyof typeof circuits
const currentCircuit = ref<DefinedCircuits>('nMosSingle')
const circuitsToChooseFrom = Object.keys(circuits) as DefinedCircuits[]

const circuit = shallowRef(circuits[currentCircuit.value])

const setCircuit = (newCircuit: DefinedCircuits) => {
  currentCircuit.value = newCircuit
  circuit.value = circuits[newCircuit]
}

const updateSlidersBasedOnNodeVoltages = () => {
  circuit.value.allSliders.forEach((slider: AngleSlider) => {
    slider.updateValueBasedOnNodeVoltages()
  })
}

const updateNodeVoltagesBasedOnSliders = () => {
  circuit.value.allSliders.forEach((slider: AngleSlider) => {
    slider.updateNodeVoltagesBasedOnValue()
  })
}

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = (event.clientX - rect.left) * canvasDpi
  const mouseY = (event.clientY - rect.top) * canvasDpi
  return { mouseX, mouseY }
}

const checkDrag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  let anySlidersDragging = false
    circuit.value.allSliders.forEach(slider => {
      slider.checkDrag({x: mouseX, y: mouseY}, event.button == 1)
      if (slider.dragging) {
        anySlidersDragging = true
      }
  })

  if (!anySlidersDragging) {
    Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
      mosfet.mouseDownInsideSelectionArea = mosfet.checkSelectionArea({x: mouseX, y: mouseY})
    })
  }

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

const mouseUp = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  let anySlidersDragging = false
  circuit.value.allSliders.forEach((slider) => {
    if (slider.dragging) {
      anySlidersDragging = true
    }
    slider.releaseSlider()
  })

  if (!anySlidersDragging) {
    Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
      if (mosfet.mouseDownInsideSelectionArea && mosfet.checkSelectionArea({x: mouseX, y: mouseY})) {
        mosfet.selected = !mosfet.selected
        mosfet.chartVisibility = Visibility.Visible
      } else {
        mosfet.selected = false // unselect everything when you click somewhere else
        mosfet.chartVisibility = Visibility.Hidden
      }
      mosfet.mouseDownInsideSelectionArea = false
    })
  }

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', mouseUp)
}

const draw = () => {
  if (!ctx.value || !canvas.value) return

  const dpi = canvasDpi
  canvas.value.width = canvasSize.x * dpi
  canvas.value.height = canvasSize.y * dpi
  canvas.value.style.width = `${canvasSize.x}px`
  canvas.value.style.height = `${canvasSize.y}px`

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

    // if (ctx.value) ctx.value.scale(0.8, 0.8)
    document.addEventListener('click', handleClickOutside)

    draw()
    requestAnimationFrame(animate)

  }
})

onBeforeUnmount(() => {
  // document.removeEventListener('click', handleClickOutside);
})
</script>

<style scoped>
canvas {
  border: 1px solid black;
}

.v-enter-active,
.v-leave-active {
  transition: transform 0.15s ease;
}

.v-enter-from,
.v-leave-to {
  transform: translateX(-300px);
}
</style>
