import { canvasId, Point, Visibility } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { toSiPrefix } from "../functions/toSiPrefix"
import { between, toRadians } from "../functions/extraMath"
import { Node } from "./node"
import { Ref } from "vue"
import { CtxSlider } from "./ctxSlider"

export class AngleSlider extends CtxSlider{
    radius: number
    originalRadius: number
    endAngle: number
    displayText: string

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], fromNode: Ref<Node>, toNode: Ref<Node>, drivenNode: 'fromNode' | 'toNode', centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility, canvasId: canvasId = 'main') {
        super(parentTransformations, (new TransformationMatrix()).translate({x: centerX, y: centerY}).rotate(startAngle).mirror(false, CCW), fromNode, toNode, drivenNode, minValue, maxValue, visibility, canvasId)

        this.radius = radius
        this.originalRadius = radius
        this.endAngle = endAngle
        this.displayText = name
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.visibility == 'hidden') {
            return
        }
        this.transformationMatrix.transformCanvas(ctx)

        if (this.dragging && this.preciseDragging) {
            this.radius = this.originalRadius + 10
        } else {
            this.radius = this.originalRadius
        }

        // draw slider path
        ctx.strokeStyle = this.visibility == 'visible' ? 'orange' : 'lightgrey'
        ctx.lineWidth = this.localLineThickness
        ctx.beginPath()
        ctx.arc(0, 0, this.radius, 0, this.endAngle, false)

        // switch head and tail if the min and max are negative valued
        const headAngle = this.endAngle
        const tailAngle = 0

        // draw tail flourish on slider path
        const tailSize = 7
        ctx.moveTo((this.radius + tailSize) * Math.cos(tailAngle), (this.radius + tailSize) * Math.sin(tailAngle))
        ctx.lineTo((this.radius - tailSize) * Math.cos(tailAngle), (this.radius - tailSize) * Math.sin(tailAngle))

        // draw head flourish on slider path
        const headSize = 7
        const arrowAngle = toRadians(-5)
        ctx.moveTo((this.radius + headSize) * Math.cos(headAngle + arrowAngle), (this.radius + headSize) * Math.sin(headAngle + arrowAngle))
        ctx.lineTo((this.radius           ) * Math.cos(headAngle            ), (this.radius           ) * Math.sin(headAngle            ))
        ctx.lineTo((this.radius - headSize) * Math.cos(headAngle + arrowAngle), (this.radius - headSize) * Math.sin(headAngle + arrowAngle))
        ctx.stroke()

        if (this.dragging && this.preciseDragging) {
            // draw tick marks
            const drawTickAtAngle = (angle: number, majorTick: boolean = true) => {
                const outerRadius = this.radius + (majorTick ? 15 : 8)
                ctx.beginPath()
                ctx.moveTo(this.radius * Math.cos(angle), this.radius * Math.sin(angle))
                ctx.lineTo(outerRadius * Math.cos(angle),   outerRadius   * Math.sin(angle))
                ctx.stroke()
            }
            // find all locations between temporaryMinValue and temporaryMaxValue that should have a tick and draw one
            let x = Math.ceil(this.temporaryMinValue) // major ticks every 1 unit
            while (x < this.temporaryMaxValue) {
                const percentValue = (x - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
                drawTickAtAngle((this.endAngle) * percentValue, true)
                x += 1
            }
            x = Math.ceil(this.temporaryMinValue + 0.5) - 0.5 // minor ticks every 1 unit starting on n + 1/2 for integer n
            while (x < this.temporaryMaxValue) {
                const percentValue = (x - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
                drawTickAtAngle((this.endAngle) * percentValue, false)
                x += 1
            }
        }

        // draw draggable slider circle
        ctx.beginPath()
        ctx.arc(this.location.x, this.location.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = this.visibility == 'visible' ? 'rgb(255, 0, 0)' : 'lightgrey'
        ctx.fill()

        ctx.fillStyle = this.visibility == 'visible' ? '#000' : 'lightgrey'

        const textLocation: Point = {
            x: this.location.x * (this.radius + 15) / this.radius,
            y: this.location.y * (this.radius + 15) / this.radius,
        }

        ctx.font = '18px Arial'
        const nextLineLocation = this.fillTextGlobalReferenceFrame(ctx, textLocation, this.displayText, true, false, 18)
        ctx.font = '16px Arial'
        this.fillTextGlobalReferenceFrame(ctx, nextLineLocation, toSiPrefix(this.value, 'V', 3), true)
    }

    updateLocationBasedOnValue() {
        const normalizedSliderValue = (this.value - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue)
        const sliderAngle = normalizedSliderValue * (this.endAngle)
        this.location = {
            x: this.radius * Math.cos(sliderAngle),
            y: this.radius * Math.sin(sliderAngle),
        }
    }

    updateValueBasedOnMousePosition(localMousePosition: Point) {
        const mouseAngle = Math.atan2(localMousePosition.y, localMousePosition.x)

        const percentValue = between(0, 1, mouseAngle / this.endAngle)
        this.value = percentValue * (this.temporaryMaxValue - this.temporaryMinValue) + this.temporaryMinValue
        this.updateLocationBasedOnValue()
    }

    mouseDownIntiatesDrag(localMousePosition: Point): Boolean {
        const mouseRadiusSquared = (localMousePosition.x) ** 2 + (localMousePosition.y) ** 2
        const mouseDistanceFromDraggableSliderSquared = (localMousePosition.x - this.location.x) ** 2 + (localMousePosition.y - this.location.y) ** 2
        const mouseTheta = Math.atan2(localMousePosition.y, localMousePosition.x)
        const sliderValue = mouseTheta / this.endAngle

        if (mouseDistanceFromDraggableSliderSquared <= 10 ** 2) { // mouse hovering over slider knob
            return true
        }
        if (((this.radius - 20) ** 2 < mouseRadiusSquared) && (mouseRadiusSquared < (this.radius + 20) ** 2) && (0 < sliderValue && sliderValue < 1)) { // mouse hovering over slider arc
            return true
        }
        return false
    }
}
