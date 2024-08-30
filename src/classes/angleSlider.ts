import { Point, RelativeDirection, Visibility } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { toSiPrefix } from "../functions/toSiPrefix"
import { toRadians } from "../functions/extraMath"

export class AngleSlider extends CtxArtist{
    dragging: boolean
    preciseDragging: boolean
    location: Point
    radius: number
    originalRadius: number
    endAngle: number
    displayText: string
    displayTextLocation: RelativeDirection
    minValue: number
    maxValue: number
    value: number // a number between minValue and maxValue
    visibility: Visibility
    displayNegative: boolean
    temporaryMinValue: number
    temporaryMaxValue: number
    previousValue: number
    valueRateOfChange: number

    constructor(parentTransformationMatrix: TransformationMatrix, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility, displayNegative: boolean = false) {
        super(parentTransformationMatrix.translate({x: centerX, y: centerY}).rotate(startAngle).mirror(false, CCW))

        this.dragging = false
        this.preciseDragging = false
        this.location = {x: 0, y: 0}
        this.radius = radius
        this.originalRadius = radius
        this.endAngle = endAngle
        this.minValue = minValue
        this.maxValue = maxValue
        this.value = minValue
        this.displayText = name
        this.displayTextLocation = CCW ? RelativeDirection.Right : RelativeDirection.Left
        this.visibility = visibility
        this.displayNegative = displayNegative
        this.temporaryMinValue = minValue
        this.temporaryMaxValue = maxValue
        this.previousValue = minValue
        this.valueRateOfChange = 0
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.visibility == Visibility.Hidden) {
            return
        }
        this.transformationMatrix.transformCanvas(ctx)
        const localLineThickness = this.getLocalLineThickness()

        // draw slider path
        ctx.strokeStyle = this.visibility == Visibility.Visible ? 'orange' : 'lightgrey'
        ctx.lineWidth = localLineThickness
        ctx.beginPath()
        ctx.arc(0, 0, this.radius, 0, this.endAngle, false)

        // switch head and tail if the min and max are negative valued
        const headAngle = this.displayNegative ? 0 : this.endAngle
        const tailAngle = this.displayNegative ? this.endAngle : 0

        // draw tail flourish on slider path
        const tailSize = 7
        ctx.moveTo((this.radius + tailSize) * Math.cos(tailAngle), (this.radius + tailSize) * Math.sin(tailAngle))
        ctx.lineTo((this.radius - tailSize) * Math.cos(tailAngle), (this.radius - tailSize) * Math.sin(tailAngle))

        // draw head flourish on slider path
        const headSize = 7
        const headDirection = (this.displayNegative) ? 1 : -1
        const arrowAngle = headDirection * toRadians(5)
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
        ctx.fillStyle = this.visibility == Visibility.Visible ? 'rgb(255, 0, 0)' : 'lightgrey'
        ctx.fill()

        ctx.fillStyle = this.visibility == Visibility.Visible ? '#000' : 'lightgrey'

        const textLocation: Point = {
            x: this.location.x * (this.radius + 15) / this.radius,
            y: this.location.y * (this.radius + 15) / this.radius,
        }

        ctx.font = '18px Arial'
        const nextLineLocation = this.fillTextGlobalReferenceFrame(ctx, textLocation, this.displayText, true, false, 18)
        ctx.font = '16px Arial'
        this.fillTextGlobalReferenceFrame(ctx, nextLineLocation, toSiPrefix(this.value * (this.displayNegative ? -1 : 1), 'V', 3), true)
    }
  }
