import { ref } from "vue"

export const moveNodesInResponseToCircuitState = ref(true)
export const drawGrid = ref(false)
export const canvasDpi = ref(2)

export const canvasSize = ref({
    width: 1,
    height: 1
})

export const getCanvasSize = (ctx: CanvasRenderingContext2D) => {
    canvasSize.value = {
        width: ctx.canvas.clientWidth,
        height: ctx.canvas.clientHeight
    }
}
