import { Ref } from "vue"
import { canvasDpi, getCanvasSize } from "../globalState"

export const setUpCtx = (myCanvas: Ref<null | HTMLCanvasElement>, myCtx: Ref<null | CanvasRenderingContext2D>, myCanvasSize: Ref<{width: number, height: number}>): boolean => {
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

export const getMousePos = (event: PointerEvent) => {
    const myCanvas = event.target as HTMLCanvasElement
    if (!myCanvas) return { mouseX: 0, mouseY: 0 }
    const rect = myCanvas.getBoundingClientRect()
    const mouseX = (event.clientX - rect.left) * canvasDpi.value
    const mouseY = (event.clientY - rect.top) * canvasDpi.value
    return { mouseX, mouseY }
}
