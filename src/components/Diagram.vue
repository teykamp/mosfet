<template>
  <!-- <Chart :points="circuit.devices.mosfets[0].vgs.data" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A"
    v-bind:cornerToCornerGraph="true" />
  <Chart :points="circuit.devices.mosfets[0].vds.data" xAxisLabel="Vds" yAxisLabel="% Saturated Current" xUnit="V" yUnit="%"
    v-bind:cornerToCornerGraph="true" /> -->

  <div style="position: absolute; top: 10px; left: 10px;">
    <button @click.stop="showSideBar = !showSideBar">Menu</button>
  </div>

  <Transition>
    <div v-show="showSideBar" ref="sideBar"
      style="display: flex; flex-direction: column; width: 250px; height: 100vh; padding: 10px; background-color: whitesmoke; position: absolute;">
      <h3 style="text-align: center;">Circuits</h3>
      <div style="border: 1px solid grey;"></div>
      <button v-for="circuit in circuitsToChooseFrom" @click.prevent="setCircuit(circuit)"
        :style="`margin-bottom: 10px; background-color: ${circuit === currentCircuit ? 'rgb(200, 200, 200)' : ''};`">{{
        circuit }}</button>
      <div style="border: 1px solid grey; margin-top: 20px; margin-bottom: 30px;"></div>
      <input type="range" min="1" max="5" step="1" v-model="canvasDpi">
      <div style="display: flex; flex-wrap: wrap; width: 210px; justify-content: end;">
        <Switch label-up="On" label-down="Off" option="Draw Grid" v-model="drawGrid" />
        <Switch label-up="On" label-down="Off" option="Floating Nodes" v-model="moveNodesInResponseToCircuitState" />
      </div>
      <button @click="showSideBar = false" style="position: absolute; bottom: 40px; right: 15px;">Close</button>
    </div>
  </Transition>

  <div :style="{
    display: xs ? undefined : 'flex',
    justifyContent: 'center',
  }">
    <canvas ref="canvas" :style="{
      width: computeCanvasWidth,
      height: computeCanvasHeight,
      flexGrow: xs ? undefined : 1,
    }" @mousedown="checkDrag"></canvas>
    <button
      v-if="xs"
      @click="showGraphBar = !showGraphBar"
      style="position: absolute; bottom: 0; font-size: xx-large; padding: 5px; width: 100px; right: calc(50% - 50px);"
    > {{ showGraphBar ? 'V' : '^' }} </button>
    <button
      v-else
      @click="showGraphBar = !showGraphBar"
      style="position: absolute; right: 0; font-size: xx-large; padding: 5px; height: 100px; top: calc(50vh - 50px);"
    > {{ showGraphBar ? '>' : '<' }} </button>
    <div
      v-show="showGraphBar"
      :style="computeSmallCanvasStyles"
    >
      <canvas style="background-color: yellow;" :height="xs ? (1 / 6 * screenHeight - 17) : (1 / 2 * screenHeight - 17)" :width="xs ? (1 / 2.5 * screenWidth) : (1 / 6 * screenWidth)"></canvas>
      <canvas style=" background-color: green" :height="xs ? (1 / 6 * screenHeight - 17) : (1 / 2 * screenHeight - 17)" :width="xs ? (1 / 2.5 * screenWidth) : (1 / 6 * screenWidth)"></canvas>
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount, computed } from 'vue'
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { CtxSlider } from '../classes/ctxSlider'
import Switch from './Switch.vue'
import { moveNodesInResponseToCircuitState, drawGrid, canvasDpi, getCanvasSize, canvasSize } from '../globalState'
import useBreakpoints from '../composables/useBreakpoints'

const { screenHeight, screenWidth, xs } = useBreakpoints()

const computeCanvasWidth = computed(() => {
  if (xs.value) {
    return '100vw'
  } else {
    return showGraphBar.value ? '82vw' : '100vw'
  }
})
const computeCanvasHeight = computed(() => {
  if (xs.value) {
    return showGraphBar.value ? '80vh' : '100vh'
  } else {
    return '100vh'
  }
})

const computeSmallCanvasStyles = computed(() => {
  if (xs.value) {
    return 'display: flex; height: 20vh; justify-content: center'
  } else {
    return 'flex-direction: column; width: 18vw'

  }
})

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
let previousTimestamp = 0

const sideBar = ref<HTMLElement | null>(null)
const showSideBar = ref(false)
const showGraphBar = ref(false)

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
  // Object.values(circuit.value.devices.mosfets).forEach((mosfet: Mosfet) => mosfet.setMinAndMaxValue())
  circuit.value.allSliders.forEach((slider: CtxSlider) => {
    slider.updateValueBasedOnNodeVoltages()
  })
}

const updateNodeVoltagesBasedOnSliders = () => {
  circuit.value.allSliders.forEach((slider: CtxSlider) => {
    slider.updateNodeVoltagesBasedOnValue()
  })
}

const getMousePos = (event: MouseEvent) => {
  if (!canvas.value) return { mouseX: 0, mouseY: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = (event.clientX - rect.left) * canvasDpi.value
  const mouseY = (event.clientY - rect.top) * canvasDpi.value
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
        if (mosfet.selectedFocus.value) {
          mosfet.selected.value = !mosfet.selected.value
        }
        // mosfet.selectedFocus.value = !mosfet.selectedFocus.value
        mosfet.selectedFocus.value = true
      } else {
        mosfet.selectedFocus.value = false // unselect everything when you click somewhere else
      }
      mosfet.mouseDownInsideSelectionArea = false
    })
  }

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', mouseUp)
}

const draw = () => {
  if (!ctx.value || !canvas.value) return
  getCanvasSize(ctx.value)

  const dpi = canvasDpi.value
  canvas.value.width = canvasSize.value.width * dpi
  canvas.value.height = canvasSize.value.height * dpi
  canvas.value.style.width = `${canvasSize.value.width}px`
  canvas.value.style.height = `${canvasSize.value.height}px`

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
