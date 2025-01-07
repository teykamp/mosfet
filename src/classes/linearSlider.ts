import { canvasId, Point, Visibility } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { toSiPrefix } from "../functions/toSiPrefix"
import { between, toRadians } from "../functions/extraMath"
import { Node } from "./node"
import { Ref } from "vue"
import { CtxSlider } from "./ctxSlider"

export class LinearSlider extends CtxSlider{
    length: number

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], fromNode: Ref<Node>, toNode: Ref<Node>, drivenNode: 'fromNode' | 'toNode', startX: number, startY: number, length: number, minValue: number, maxValue: number, name: string, visibility: Visibility, canvasId: canvasId = 'main') {
        super(parentTransformations, (new TransformationMatrix()).translate({x: startX, y: startY}), fromNode, toNode, drivenNode, minValue, maxValue, visibility, visibility, canvasId)

        this.length = length
        this.displayText = name
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.visibility == 'hidden') {
            return
        }
        this.transformationMatrix.transformCanvas(ctx)

        // draw slider path
        ctx.strokeStyle = this.visibility == 'visible' ? 'orange' : 'lightgrey'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(this.length, 0)
        ctx.stroke()

        // draw tail flourish on slider path
        const tailSize = 20
        ctx.moveTo(0, -tailSize)
        ctx.lineTo(0, tailSize)
        ctx.stroke()

        // draw head flourish on slider path
        const headSize = 20
        const arrowAngle = toRadians(90 + 25)
        ctx.moveTo(this.length + headSize * Math.cos(arrowAngle), headSize * Math.sin(arrowAngle))
        ctx.lineTo(this.length, 0)
        ctx.lineTo(this.length + headSize * Math.cos(arrowAngle), headSize * Math.sin(-arrowAngle))
        ctx.stroke()

        if (this.dragging && this.preciseDragging) {
            // draw tick marks
            // const drawTickAtAngle = (angle: number, majorTick: boolean = true) => {
            //     const outerRadius = this.radius + (majorTick ? 15 : 8)
            //     ctx.beginPath()
            //     ctx.moveTo(this.radius * Math.cos(angle), this.radius * Math.sin(angle))
            //     ctx.lineTo(outerRadius * Math.cos(angle),   outerRadius   * Math.sin(angle))
            //     ctx.stroke()
            // }
            // // find all locations between temporaryMinValue and temporaryMaxValue that should have a tick and draw one
            // let x = Math.ceil(this.temporaryMinValue) // major ticks every 1 unit
            // while (x < this.temporaryMaxValue) {
            //     const percentValue = (x - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
            //     drawTickAtAngle((this.endAngle) * percentValue, true)
            //     x += 1
            // }
            // x = Math.ceil(this.temporaryMinValue + 0.5) - 0.5 // minor ticks every 1 unit starting on n + 1/2 for integer n
            // while (x < this.temporaryMaxValue) {
            //     const percentValue = (x - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
            //     drawTickAtAngle((this.endAngle) * percentValue, false)
            //     x += 1
            // }
        }

        // draw draggable slider circle
        ctx.beginPath()
        ctx.arc(this.location.x, this.location.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = this.visibility == 'visible' ? 'rgb(255, 0, 0)' : 'lightgrey'
        ctx.fill()

        ctx.fillStyle = this.visibility == 'visible' ? '#000' : 'lightgrey'

        const textLocation: Point = {
            x: this.location.x,
            y: this.location.y - 10,
        }

        ctx.font = '18px Arial'
        this.fillTextGlobalReferenceFrame(ctx, textLocation, toSiPrefix(this.value, 'V', 3), true)
    }

    updateLocationBasedOnValue() {
        const normalizedSliderValue = (this.value - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
        this.location = {
            x: normalizedSliderValue * this.length,
            y: 0,
        }
    }

    updateValueBasedOnMousePosition(localMousePosition: Point) {
        const percentValue = between(0, 1, localMousePosition.x / this.length)
        this.value = percentValue * (this.temporaryMaxValue - this.temporaryMinValue) + this.temporaryMinValue
        this.updateLocationBasedOnValue()
    }

    mouseDownIntiatesDrag(localMousePosition: Point): Boolean {
        const margin = 20
        if (
            (-margin < localMousePosition.x && localMousePosition.x < this.length + margin) &&
            (-margin < localMousePosition.y && localMousePosition.y < margin)
        ) {
            return true
        }
        return false
    }
}
