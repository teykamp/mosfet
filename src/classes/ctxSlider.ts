import { canvasId, Point, Visibility } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { between } from "../functions/extraMath"
import { Node } from "./node"
import { Ref } from "vue"
import { preciseSliderTickRange } from "../constants"

export class CtxSlider extends CtxArtist{
    visibility: Visibility
    originalVisibility: Visibility
    fromNode: Ref<Node>
    toNode: Ref<Node>
    dragging: boolean = false
    location: Point = {x: 0, y: 0}
    minValue: number
    maxValue: number
    value: number // a number between minValue and maxValue
    drivenNode: 'fromNode' | 'toNode'
    canvasId: canvasId

    preciseDragging: boolean = false
    temporaryMinValue: number
    temporaryMaxValue: number
    previousValue: number
    valueRateOfChange: number = 0


    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], localTransformationMatrix: TransformationMatrix = new TransformationMatrix(), fromNode: Ref<Node>, toNode: Ref<Node>, drivenNode: 'fromNode' | 'toNode', minValue: number, maxValue: number, originalVisibility: Visibility = 'visible', visibility: Visibility = 'visible', canvasId: canvasId = 'main') {
        super(parentTransformations, localTransformationMatrix)

        this.originalVisibility = originalVisibility
        this.visibility = visibility
        this.fromNode = fromNode
        this.toNode = toNode
        this.minValue = minValue
        this.maxValue = maxValue
        this.value = minValue
        this.temporaryMinValue = minValue
        this.temporaryMaxValue = maxValue
        this.previousValue = minValue
        this.drivenNode = drivenNode
        this.canvasId = canvasId
    }

    draw(ctx: CanvasRenderingContext2D) {
        // to be implemented by child classes
        throw new Error("draw is a virtual function on the CtxSlider class. (Received" + ctx + ")")
    }

    updateLocationBasedOnValue() {
        // to be implemented by child classes
        throw new Error("updateLocationBasedOnValue is a virtual function on the CtxSlider class.")
    }

    updateValueBasedOnMousePosition(localMousePosition: Point) {
        // to be implemented by child classes
        throw new Error("updateValueBasedOnMousePosition is a virtual function on the CtxSlider class. (Received" + localMousePosition + ")")
    }

    mouseDownIntiatesDrag(localMousePosition: Point): Boolean {
        // to be implemented by child classes
        throw new Error("mouseDownIntiatesDrag is a virtual function on the CtxSlider class. (Received" + localMousePosition + ")")
    }

    updateValueBasedOnNodeVoltages() {
        this.value = between(this.temporaryMinValue, this.temporaryMaxValue, this.toNode.value.voltage - this.fromNode.value.voltage)
        this.updateLocationBasedOnValue()
    }

    updateNodeVoltagesBasedOnValue() {
        if (this.dragging) {
            if (this.drivenNode == 'toNode') {
                this.toNode.value.fixed = true
                this.toNode.value.voltage = this.fromNode.value.voltage + this.value
            } else {
                this.fromNode.value.fixed = true
                this.fromNode.value.voltage = this.toNode.value.voltage - this.value
            }
        }
    }

    dragSlider(mousePosition: Point) {
        if (this.dragging) {
            const transformedMousePos = this.transformationMatrix.inverse().transformPoint(mousePosition)
            this.updateValueBasedOnMousePosition(transformedMousePos)

            this.value = between(this.temporaryMinValue, this.temporaryMaxValue, this.value)
            const percentValue = between(0, 1, (this.value - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue))

            if ((percentValue < 0.05) && (this.value <= this.previousValue)) {
                this.valueRateOfChange = -0.01
            }
            else if ((percentValue > 0.95) && (this.value >= this.previousValue)) {
                this.valueRateOfChange = 0.01
            }
            else {
                this.valueRateOfChange = 0
            }

            this.updateLocationBasedOnValue()
            this.updateNodeVoltagesBasedOnValue()
            this.previousValue = this.value
        }
    }

    releaseSlider() {
        this.temporaryMinValue = this.minValue
        this.temporaryMaxValue = this.maxValue
        this.preciseDragging = false
        this.dragging = false
        if (this.drivenNode == 'toNode') {
            this.toNode.value.fixed = false
        } else {
            this.fromNode.value.fixed = false
        }
    }

    adjustPreciseSlider(timeDifference: number = 10) {
        if (this.dragging && this.preciseDragging) {
            if ((this.value >= this.maxValue) || (this.temporaryMaxValue > this.maxValue)) {
                this.value = this.maxValue
                this.temporaryMaxValue = this.maxValue
                this.temporaryMinValue = this.maxValue - preciseSliderTickRange
                this.valueRateOfChange = 0
            }
            else if ((this.value <= this.minValue) || (this.temporaryMinValue < this.minValue)) {
                this.value = this.minValue
                this.temporaryMinValue = this.minValue
                this.temporaryMaxValue = this.minValue + preciseSliderTickRange
                this.valueRateOfChange = 0
            }
            else {
                this.temporaryMinValue += this.valueRateOfChange * (timeDifference / 1000) * 70
                this.temporaryMaxValue += this.valueRateOfChange * (timeDifference / 1000) * 70
                this.value += this.valueRateOfChange * (timeDifference / 1000) * 70
            }
        }
    }

    checkDrag(mousePosition: Point, isPreciseDragging: boolean) {
        if (this.visibility != 'visible') {
            return
        }

        const transformedMousePos = this.transformationMatrix.inverse().transformPoint(mousePosition)
        if (this.mouseDownIntiatesDrag(transformedMousePos)) {
            this.dragging = true
        }

        if (this.dragging) {
            if (isPreciseDragging) {
                this.preciseDragging = true

                // set the temporary min and max slider values
                const percentValue = (this.value - this.minValue) / (this.maxValue - this.minValue)
                this.temporaryMinValue = this.value - preciseSliderTickRange * percentValue
                this.temporaryMaxValue = this.value + preciseSliderTickRange * (1 - percentValue)
            }
            else {
                this.temporaryMinValue = this.minValue
                this.temporaryMaxValue = this.maxValue
            }
        }
    }
}
