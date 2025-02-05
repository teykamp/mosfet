<template>
  <div style="display: none; position: absolute; top: 10px; left: 500px;">
    {{ lastSelectionEvent }}
    Node Voltages:<br>
    {{ JSON.stringify(Object.fromEntries(Object.entries(circuit.nodes).map((value: [string, Ref<NodeClass>]) => [value[0], toSiPrefix(value[1].value.voltage, "V", 3)])), null, 2) }}
  </div>

  <div v-show="showContextMenu" :style="`left: ${contextMenuLocation.x}px; top: ${contextMenuLocation.y}px; position: absolute;`">
    <ContextMenu :menu-options="contextMenuOptions"></ContextMenu>
  </div>

  <div style="position: absolute; top: 10px; left: 10px;">
    <button @click.stop="showSideBar = !showSideBar">Menu</button>
  </div>

  <Transition>
    <div v-show="showSideBar" ref="sideBar"
      style="display: flex; flex-direction: column; width: 250px; height: 95%; padding: 10px; background-color: whitesmoke; position: absolute; overflow: auto">
      <h3 style="text-align: center;">Circuits</h3>
      <div style="border: 1px solid grey; margin-bottom: 5px;"></div>
      <button v-for="circuit in circuitsToChooseFrom" @click.prevent="setCircuit(circuit)"
        :style="`margin-bottom: 10px; background-color: ${circuit === currentCircuit ? 'rgb(200, 200, 200)' : ''};`">{{
        circuit }}</button>
      <div style="border: 1px solid grey; margin-top: 20px; margin-bottom: 30px;"></div>
      <button @click="showSettings = !showSettings">{{ showSettings ? 'Hide' : 'Show' }} Settings</button>
      <div v-show="showSettings" style="display: flex; flex-wrap: wrap; width: 210px; justify-content: end;">
        <p>Resolution</p>
        <input type="range" min="1" max="5" step="1" v-model="canvasDpi">
        <Switch label-up="On" label-down="Off" option="Draw Grid" v-model="drawGrid" />
        <Switch label-up="On" label-down="Off" option="Sliders Active" v-model="slidersActive" @click="updateSlidersActive()"/>
        <Switch label-up="On" label-down="Off" option="Floating Nodes" v-model="moveNodesInResponseToCircuitState" />
        <Switch label-up="On" label-down="Off" option="Early Effect" v-model="includeEarlyEffect" />
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
      @pointerdown="checkDrag"
      @contextmenu.prevent="checkContextMenu"
      :style="`background-color: white; margin-right: 5px; border-radius: 10px; width: ${computedCanvasLayout.mainCanvas.width}px; height: ${computedCanvasLayout.mainCanvas.height}px; touch-action: none`"
      class="main"
    ></canvas>

      <div
      :style="{
        display: 'flex',
        flexDirection: xs ? 'row' : 'column',
      }">
        <canvas
          ref="graphBarChartCanvas"
          @pointerdown="checkDrag"
          :style="`border-radius: 10px; margin-right: 5px; margin-top: ${xs ? 5 : 0}px; background-color: white; width: ${computedCanvasLayout.graphBarChartCanvas.width}px; height: ${computedCanvasLayout.graphBarChartCanvas.height}px; display: ${showGraphBar ? 'block' : 'none'}; touch-action: none`"
          class="chart"
        ></canvas>

        <div v-if="showGraphBar" :style="{maxWidth: computedCanvasLayout.graphBarChartCanvas.width, maxHeight: computedCanvasLayout.graphBarChartCanvas.height}">
          <div :style="`margin-top: 5px; overflow-y: auto; overflow-x: hidden; height: ${computedCanvasLayout.graphBarChartCanvas.height}px; border-radius: 10px; border: 1px solid black; padding: 5px;`">
            <AllVoltageSliders :html-sliders="circuit.htmlSliders"></AllVoltageSliders>
          </div>
        </div>

      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, type Ref } from 'vue'
import { circuits, DefinedCircuits } from '../circuits/circuits'
import { CtxSlider } from '../classes/ctxSlider'
import Switch from './Switch.vue'
import { moveNodesInResponseToCircuitState, drawGrid, slidersActive, canvasDpi, getCanvasSize, canvasSize, graphBarChartCanvasSize, lastSelectionEvent, lastMouseSelectionEvent, includeEarlyEffect } from '../globalState'
import useBreakpoints from '../composables/useBreakpoints'
import { CtxArtist } from '../classes/ctxArtist'
import { schematicScale } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node as NodeClass } from '../classes/node'
import { toSiPrefix } from '../functions/toSiPrefix'
import { eventInitiatesPreciseDragging } from '../functions/eventInitiatesPreciseDragging'
import AllVoltageSliders from './AllVoltageSliders.vue'
import { Device } from '../classes/device'
import { circuit, circuitsToChooseFrom, currentCircuit } from '../globalCircuits'
import ContextMenu from './ContextMenu.vue'
import { contextMenuOption, Point } from '../types'

const { screenHeight, screenWidth, xs } = useBreakpoints()

const computedCanvasLayout = computed(() => {
  const padding = 40
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
    height: screenHeight.value - padding / 2 - 5
  }

  const graphBarChartCanvas = xs.value ?
  {
    width: (screenWidth.value + 10) / 2 - borderWidth,
    height: bottomGraphHeight
  } :
  {
    width: sideGraphWidth,
    height: (screenHeight.value - padding) / 2 - borderWidth
  }

  return {
    mainCanvas,
    graphBarChartCanvas,
    borderWidth
  }
})

const canvas = ref<null | HTMLCanvasElement>(null)
const ctx = ref<null | CanvasRenderingContext2D>(null)
const graphBarChartCanvas = ref<null | HTMLCanvasElement>(null)
const graphBarChartCtx = ref<null | CanvasRenderingContext2D>(null)

let previousTimestamp = 0

const sideBar = ref<HTMLElement | null>(null)
const showSideBar = ref(false)
const showSettings = ref(false)
const showGraphBar = ref(true)

const handleClickOutside = (event: MouseEvent) => {
  if (sideBar.value && !sideBar.value.contains(event.target as Node)) showSideBar.value = false
}

const updateSlidersActive = () => {
  Object.values(circuits).forEach((circuit: Circuit) => {circuit.setSlidersActive(slidersActive.value)})
}
updateSlidersActive()

if (!window.Worker) {
  console.error('Your browser doesn\'t support web workers.');
}

const worker = new Worker(new URL('../workers/incrementCircuitWorker.ts', import.meta.url), { type: 'module' })
worker.onmessage = (event: MessageEvent<string>) => {
  circuit.value.nodeVoltagesFromJson(event.data)
}

const setCircuit = (newCircuit: DefinedCircuits) => {
  currentCircuit.value = newCircuit
  circuit.value = circuits[newCircuit]
}

const updateSlidersBasedOnNodeVoltages = () => {
  circuit.value.allSliders.forEach((slider: CtxSlider) => {
    slider.updateValueBasedOnNodeVoltages()
  })
}

const updateNodeVoltagesBasedOnSliders = () => {
  circuit.value.allSliders.forEach((slider: CtxSlider) => {
    slider.updateNodeVoltagesBasedOnValue()
  })
}

const getMousePos = (event: PointerEvent | MouseEvent) => {
  const myCanvas = event.target as HTMLCanvasElement
  if (!myCanvas) return { mouseX: 0, mouseY: 0 }
  const rect = myCanvas.getBoundingClientRect()
  const mouseX = (event.clientX - rect.left) * canvasDpi.value
  const mouseY = (event.clientY - rect.top) * canvasDpi.value
  return { mouseX, mouseY }
}

const showContextMenu = ref(false)
const contextMenuLocation: Ref<Point> = ref({x: 0, y: 0})
const contextMenuOptions: Ref<contextMenuOption[]> = ref([])

const checkContextMenu = (event: MouseEvent) => {
  const { mouseX, mouseY } = getMousePos(event)
  contextMenuLocation.value = {x: event.clientX, y: event.clientY}

  event.preventDefault()
  Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
    if (mosfet.checkSelectionArea({x: mouseX, y: mouseY})) {
        contextMenuOptions.value = [
          {
            name: mosfet.showCharts.value ? "Hide IV Characteristics" : "Show IV Characteristics",
            action: () => {
              mosfet.toggleSelected()
              showContextMenu.value = false
            }
          }
        ]
        showContextMenu.value = true
      }
    })
    Object.values(circuit.value.devices.voltageSources).forEach(voltageSource => {
      if (voltageSource.checkSelectionArea({x: mouseX, y: mouseY})) {
        // pass
      }
    })

}

const checkDrag = (event: PointerEvent) => {
  lastSelectionEvent.value = 'canvas'
  lastMouseSelectionEvent.value = 'canvas'
  showContextMenu.value = false
  if (event.button == 2) { // right click
    return
  }
  const { mouseX, mouseY } = getMousePos(event)
  circuit.value.allSliders.forEach(slider => {
    if (slider.canvasId == (event.target as HTMLElement).className) {
      slider.checkDrag({x: mouseX, y: mouseY}, eventInitiatesPreciseDragging(event))
      if (slider.dragging) {
        event.preventDefault()
        slider.selected.value = true
      }
    }
  })

  if (!circuit.value.anySlidersDragging) {
    circuit.value.allDevices.forEach((device: Device) => {
      if (device.canvasId == (event.target as HTMLElement).className) {
        device.mouseDownInsideSelectionArea = device.checkSelectionArea({x: mouseX, y: mouseY})
      }
    })
  }

  drag(event) // move the slider to the current mouse coordinates immediately (do not wait for another PointerEvent to start dragging) (for click w/o drag)
  document.addEventListener('pointermove', drag)
  document.addEventListener('pointerup', mouseUp)
}

const drag = (event: PointerEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  // update slider values based on position
  circuit.value.allSliders.forEach(slider => {
    slider.dragSlider({x: mouseX, y: mouseY})
  })

  updateNodeVoltagesBasedOnSliders()
}

const mouseUp = (event: PointerEvent) => {
  const { mouseX, mouseY } = getMousePos(event)

  if (!circuit.value.anySlidersDragging && (event.target as HTMLElement).className == 'main') {
    circuit.value.resetSelectedDevice()
    Object.values(circuit.value.devices.mosfets).forEach(mosfet => {
      if (mosfet.mouseDownInsideSelectionArea && mosfet.checkSelectionArea({x: mouseX, y: mouseY})) {
        // if (mosfet.selected.value) {
        //   mosfet.toggleSelected()
        // }
        mosfet.selected.value = true
        circuit.value.setSelectedDevice(mosfet)
      } else {
        mosfet.selected.value = false // unselect everything when you click somewhere else
      }
      mosfet.mouseDownInsideSelectionArea = false
    })
    Object.values(circuit.value.devices.voltageSources).forEach(voltageSource => {
      if (voltageSource.mouseDownInsideSelectionArea && voltageSource.checkSelectionArea({x: mouseX, y: mouseY})) {
        voltageSource.selected.value = true
        circuit.value.setSelectedDevice(voltageSource)
      } else {
        voltageSource.selected.value = false // unselect everything when you click somewhere else
      }
      voltageSource.mouseDownInsideSelectionArea = false
    })
  }

  circuit.value.allSliders.forEach((slider) => {
    slider.releaseSlider()
  })

  document.removeEventListener('pointermove', drag)
  document.removeEventListener('pointerup', mouseUp)
}

const onKeyDown = (event: KeyboardEvent) => {
  if (['Tab', 'Enter', 'Up', 'ArrowUp', 'Down', 'ArrowDown'].includes(event.key)) {
    lastSelectionEvent.value = 'keyboard'
  }
}

const checkSelectedDevice = () => {
  circuit.value.allDevices.forEach((device: Device) => {
    if (device.selected.value) {
      circuit.value.setSelectedDevice(device)
    }
  })
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

const draw = () => {
  if (!setUpCtx(canvas, ctx, canvasSize)) return
  if (!setUpCtx(graphBarChartCanvas, graphBarChartCtx, graphBarChartCanvasSize)) return

  checkSelectedDevice()

  const json = circuit.value.fixedNodeVoltagesToJson()
  worker.postMessage(json)

  updateSlidersBasedOnNodeVoltages()
  circuit.value.draw(ctx.value as CanvasRenderingContext2D)

  // draw the graph bar canvases if active
  if (circuit.value.anyDevicesSelected && showSideBar) {
    CtxArtist.textTransformationMatrix.relativeScale = circuit.value.circuitCopy!.transformationMatrix.relativeScale / schematicScale
    circuit.value.drawSelectedDeviceCharts(graphBarChartCtx.value as CanvasRenderingContext2D)
  }
}

const animate = (timestamp: number) => {
  const timeDifference = timestamp - previousTimestamp
  previousTimestamp = timestamp

  circuit.value.allSliders.forEach((slider) => {
    slider.adjustPreciseSlider(timeDifference)
  })
  updateNodeVoltagesBasedOnSliders()

  // update current dots on mosfets and capacitors
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
    document.addEventListener('keydown', onKeyDown)

    draw()
    requestAnimationFrame(animate)

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
