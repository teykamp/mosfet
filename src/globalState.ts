import { Ref, ref } from "vue"
import { mouseSelectionEvent, selectionEvent } from "./types"

export const moveNodesInResponseToCircuitState = ref(false)
export const drawGrid = ref(false)
export const slidersActive = ref(false)
export const canvasDpi = ref(2)
export const lastSelectionEvent: Ref<selectionEvent> = ref('canvas')
export const lastMouseSelectionEvent: Ref<mouseSelectionEvent> = ref('canvas')
export const showSideBar = ref(false)

export const canvasSize = ref({
    width: 1,
    height: 1
})

export const graphBarChartCanvasSize = ref({
    width: 1,
    height: 1
})

export const getCanvasSize = (myCtx: CanvasRenderingContext2D, myCanvasSize: Ref<{width: number, height: number}>) => {
    myCanvasSize.value = {
        width: myCtx.canvas.clientWidth,
        height: myCtx.canvas.clientHeight
    }
}

export const includeEarlyEffect = ref(false)
