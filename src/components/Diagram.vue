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
  <div>

    <div :style="{
      display: 'flex',
      flexDirection: xs ? 'column' : 'row',
    }">
      <canvas
        ref="canvas"
        @mousedown="checkDrag"
        :style="`border-color: blue; border-width: 2px; background-color: white; width: ${computedCanvasLayout.mainCanvas.width}px; height: ${computedCanvasLayout.mainCanvas.height}px;`"
        class="main"
      ></canvas>

      <div
      :style="{
        display: 'flex',
        flexDirection: xs ? 'row' : 'column',
      }">
        <canvas
          ref="graphBarChartCanvas"
          @mousedown="checkDrag"
          :style="`border-color: blue; border-width: ${computedCanvasLayout.borderWidth}px; background-color: white; width: ${computedCanvasLayout.graphBarChartCanvas.width}px; height: ${computedCanvasLayout.graphBarChartCanvas.height}px; display: ${showGraphBar ? 'block' : 'none'}`"
          class="chart"
        ></canvas>
        <canvas
          ref="graphBarMosfetCanvas"
          @mousedown="checkDrag"
          :style="`border-color: blue; border-width: ${computedCanvasLayout.borderWidth}px; background-color: white; width: ${computedCanvasLayout.graphBarMosfetCanvas.width}px; height: ${computedCanvasLayout.graphBarMosfetCanvas.height}px; display: ${showGraphBar ? 'block' : 'none'}`"
          class="mosfet"
        ></canvas>
      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount, computed, type Ref } from 'vue'
import { incrementCircuit } from '../functions/incrementCircuit'
import { circuits } from '../circuits/circuits'
import { CtxSlider } from '../classes/ctxSlider'
import Switch from './Switch.vue'
import { moveNodesInResponseToCircuitState, drawGrid, canvasDpi, getCanvasSize, canvasSize, graphBarMosfetCanvasSize, graphBarChartCanvasSize } from '../globalState'
import useBreakpoints from '../composables/useBreakpoints'
import { VoltageSource } from '../classes/voltageSource'
import { Mosfet } from '../classes/mosfet'
import { CtxArtist } from '../classes/ctxArtist'
import { schematicScale } from '../constants'

const { screenHeight, screenWidth, xs } = useBreakpoints()

const computedCanvasLayout = computed(() => {
  const padding = 30
  const bottomGraphHeight = screenHeight.value / 4
  const sideGraphWidth = screenWidth.value / 4
  const borderWidth = 2

  const mainCanvas = xs.value ?
  {
    width: screenWidth.value - padding,
    height: showGraphBar.value ? screenHeight.value - padding - bottomGraphHeight + 5 : screenHeight.value - padding
  } :
  {
    width: showGraphBar.value ? screenWidth.value - padding - sideGraphWidth + 5 : screenWidth.value - padding,
    height: screenHeight.value - padding
  }

  const graphBarChartCanvas = xs.value ?
  {
    width: (screenWidth.value - padding) / 2 - borderWidth,
    height: bottomGraphHeight
  } :
  {
    width: sideGraphWidth,
    height: (screenHeight.value - padding) / 2 - borderWidth
  }

  const graphBarMosfetCanvas = xs.value ?
  {
    width: (screenWidth.value - padding) / 2 - borderWidth,
    height: bottomGraphHeight
  } :
  {
    width: sideGraphWidth,
    height: (screenHeight.value - padding) / 2 - borderWidth
  }

  return {
    mainCanvas,
    graphBarChartCanvas,
    graphBarMosfetCanvas,
    borderWidth
  }
})

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
const graphBarMosfetCanvas = ref<null | HTMLCanvasElement>(null)
const graphBarMosfetCtx = ref<null | CanvasRenderingContext2D>(null)
const graphBarChartCanvas = ref<null | HTMLCanvasElement>(null)
const graphBarChartCtx = ref<null | CanvasRenderingContext2D>(null)

let previousTimestamp = 0

const sideBar = ref<HTMLElement | null>(null)
const showSideBar = ref(false)
const showGraphBar = ref(true)

const handleClickOutside = (event: MouseEvent) => {
  if (sideBar.value && !sideBar.value.contains(event.target as Node)) showSideBar.value = false
}

type DefinedCircuits = keyof typeof circuits
const currentCircuit = ref<DefinedCircuits>('nMosDiffPair')
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
  const myCanvas = event.target as HTMLCanvasElement
  if (!myCanvas) return { mouseX: 0, mouseY: 0 }
  const rect = myCanvas.getBoundingClientRect()
  const mouseX = (event.clientX - rect.left) * canvasDpi.value
  const mouseY = (event.clientY - rect.top) * canvasDpi.value
  return { mouseX, mouseY }
}

const checkDrag = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  circuit.value.allSliders.forEach(slider => {
    if (slider.canvasId == (event.target as HTMLElement).className) {
      slider.checkDrag({x: mouseX, y: mouseY}, event.button == 1)
    }
  })

  if (!circuit.value.anySlidersDragging) {
    Object.values(circuit.value.devices.mosfets).forEach((mosfet: Mosfet) => {
      if (mosfet.canvasId == (event.target as HTMLElement).className) {
        mosfet.mouseDownInsideSelectionArea = mosfet.checkSelectionArea({x: mouseX, y: mouseY})
      }
    })
    Object.values(circuit.value.devices.voltageSources).forEach((voltageSource: VoltageSource) => {
      if (voltageSource.canvasId == (event.target as HTMLElement).className) {
        voltageSource.mouseDownInsideSelectionArea = voltageSource.checkSelectionArea({x: mouseX, y: mouseY})
      }
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

  if (!circuit.value.anySlidersDragging && (event.target as HTMLElement).className == 'main') {
    circuit.value.resetSelectedDevice()
    Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
      if (mosfet.mouseDownInsideSelectionArea && mosfet.checkSelectionArea({x: mouseX, y: mouseY})) {
        if (mosfet.selectedFocus.value) {
          mosfet.selected.value = !mosfet.selected.value
        }
        mosfet.selectedFocus.value = true
        circuit.value.setSelectedDevice(mosfet)
      } else {
        mosfet.selectedFocus.value = false // unselect everything when you click somewhere else
      }
      mosfet.mouseDownInsideSelectionArea = false
    })
    Object.values(circuit.value.devices.voltageSources).forEach(voltageSource => {
      if (voltageSource.mouseDownInsideSelectionArea && voltageSource.checkSelectionArea({x: mouseX, y: mouseY})) {
        voltageSource.selectedFocus.value = true
        circuit.value.setSelectedDevice(voltageSource)
      } else {
        voltageSource.selectedFocus.value = false // unselect everything when you click somewhere else
      }
      voltageSource.mouseDownInsideSelectionArea = false
    })
  }

  circuit.value.allSliders.forEach((slider) => {
    slider.releaseSlider()
  })

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', mouseUp)
}

const setUpCtx = (myCanvas: Ref<null | HTMLCanvasElement>, myCtx: Ref<null | CanvasRenderingContext2D>, myCanvasSize: Ref<{width: number, height: number}>): boolean => {
  if (!myCanvas.value) return false
  myCtx.value = myCanvas.value.getContext('2d')
  if (!myCtx.value) return false
  getCanvasSize(myCtx.value, myCanvasSize)

  const dpi = canvasDpi.value
  myCanvas.value.width = myCanvasSize.value.width * dpi
  myCanvas.value.height = myCanvasSize.value.height * dpi
  myCanvas.value.style.width = `${myCanvasSize.value.width}px`
  myCanvas.value.style.height = `${myCanvasSize.value.height}px`

  myCtx.value.resetTransform()
  myCtx.value.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height)
  return true
}

if (!window.Worker) {
  console.log('Your browser doesn\'t support web workers.');
}

// const worker = new Worker('src/workers/incrementCircuitWorker.ts');
const worker = new Worker(new URL('../workers/incrementCircuitWorker.ts', import.meta.url), { type: 'module' })
worker.onmessage = (event: MessageEvent<string>) => {
  circuit.value.nodeVoltagesFromJson(event.data)
}

const draw = () => {
  if (!setUpCtx(canvas, ctx, canvasSize)) return
  if (!setUpCtx(graphBarMosfetCanvas, graphBarMosfetCtx, graphBarMosfetCanvasSize)) return
  if (!setUpCtx(graphBarChartCanvas, graphBarChartCtx, graphBarChartCanvasSize)) return

  // console.log(circuit.value.nodes)
  const json = circuit.value.fixedNodeVoltagesToJson()
  worker.postMessage(json)

  updateSlidersBasedOnNodeVoltages()
  circuit.value.draw(ctx.value as CanvasRenderingContext2D)

  // draw the graph bar canvases if active
  if (circuit.value.anyDevicesSelected && showSideBar) {
    CtxArtist.textTransformationMatrix.relativeScale = circuit.value.circuitCopy!.transformationMatrix.relativeScale / schematicScale
    circuit.value.circuitCopy?.draw(graphBarMosfetCtx.value as CanvasRenderingContext2D)
    circuit.value.drawSelectedDeviceCharts(graphBarChartCtx.value as CanvasRenderingContext2D)
  }
}

const animate = (timestamp: number) => {
  const timeDifference = timestamp - previousTimestamp
  previousTimestamp = timestamp
  // console.log("delta t = ", timeDifference, "ms")

  circuit.value.allSliders.forEach((slider) => {
    slider.adjustPreciseSlider(timeDifference)
  })
  updateNodeVoltagesBasedOnSliders()

  // incrementCircuit(circuit.value, timeDifference)

  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
    mosfet.currentDots.updateDotPositionBasedOnTimestamp(mosfet.current, timeDifference)
  })
  Object.values(circuit.value.circuitCopy!.devices.mosfets).forEach(mosfet => {
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
  if (graphBarMosfetCanvas.value) {
    graphBarMosfetCtx.value = graphBarMosfetCanvas.value.getContext('2d')
  }
  if (graphBarChartCanvas.value) {
    graphBarChartCtx.value = graphBarChartCanvas.value.getContext('2d')
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
