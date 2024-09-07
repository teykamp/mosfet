import { BoundingBox, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ref, Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { Schematic } from "./schematic"
import { VoltageSource } from "./voltageSource"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { canvasDpi, canvasSize, drawGrid, moveNodesInResponseToCircuitState, schematicScale } from "../constants"
import { modulo } from "../functions/extraMath"
import { drawCirclesFillSolid } from "../functions/drawFuncs"
import { TectonicPlate, TectonicPoint } from "./tectonicPlate"

export class Circuit extends CtxArtist {
    boundingBox: BoundingBox
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix
    originalTextTransformationMatrix: TransformationMatrix

    constructor(origin: Point, width: number, height: number, schematic: Schematic = new Schematic(), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        const scale = Math.min(canvasSize.x / width, canvasSize.y / height)
        const extraShift = {x: (canvasSize.x / scale - width) / 2, y: (canvasSize.y / scale - height) / 2}
        super([ref((new TransformationMatrix()).scale(canvasDpi * scale).translate(extraShift)) as Ref<TransformationMatrix>], (new TransformationMatrix()).translate({x: -origin.x + width / 2, y: -origin.y + height / 2}))

        this.boundingBox = {
            topLeft: new TectonicPoint(this.transformations, {x: origin.x - width / 2, y: origin.y - height / 2}),
            topRight: new TectonicPoint(this.transformations, {x: origin.x + width / 2, y: origin.y - height / 2}),
            bottomLeft: new TectonicPoint(this.transformations, {x: origin.x - width / 2, y: origin.y + height / 2}),
            bottomRight: new TectonicPoint(this.transformations, {x: origin.x + width / 2, y: origin.y + height / 2}),
        }

        this.schematic = schematic
        this.devices = {
            mosfets: mosfets,
            voltageSources: voltageSources,
        }
        this.nodes = nodes
        this.originalTextTransformationMatrix = textTransformationMatrix
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale / canvasDpi).multiply(this.originalTextTransformationMatrix)

        // set static transformation matrices for the circuit // must be applied during construction because it will be used immediately as other elements of the circuit are defined immediately after its definition
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix
    }

    get allSliders(): AngleSlider[] {
        return this.makeListOfSliders()
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()

        this.setScaleBasedOnBoundingBox()
        this.transformationMatrix.transformCanvas(ctx)

        // set static transformation matrices for the circuit
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix

        if (moveNodesInResponseToCircuitState) {
            let slidersDragging = false
            this.allSliders.forEach((slider: AngleSlider) => {
                if (slider.dragging) {
                    slidersDragging = true
                }
            })
            // if (!slidersDragging) {
                TectonicPlate.allTectonicPlates.forEach((tectonicPlate: TectonicPlate) => {tectonicPlate.moveTowardDesiredLocation()})
            // }
        }

        this.schematic.draw(ctx)
        Object.values(this.devices.mosfets).forEach((mosfet: Mosfet) => {mosfet.draw(ctx)})
        Object.values(this.devices.voltageSources).forEach((voltageSource: VoltageSource) => {voltageSource.draw(ctx)})

        if (drawGrid) {
            this.drawGrid(ctx)
        }

        ctx.restore()
    }

    makeListOfSliders(): AngleSlider[] {
        const allSliders: AngleSlider[] = []
        for (const mosfetId in this.devices.mosfets) {
            const mosfet = this.devices.mosfets[mosfetId]
            allSliders.push(mosfet.vgs)
            allSliders.push(mosfet.vds)
        }
        for (const voltageSourceId in this.devices.voltageSources) {
            const voltageSource = this.devices.voltageSources[voltageSourceId]
            allSliders.push(voltageSource.voltageDrop)
        }
        return allSliders
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        CtxArtist.circuitTransformationMatrix.transformCanvas(ctx)
        const topLeftCornerOfCanvasInLocalReferenceFrame = this.transformationMatrix.inverse().transformPoint({x: 0, y: 0})
        const bottomRightCornerOfCanvasInLocalReferenceFrame = this.transformationMatrix.inverse().transformPoint({x: canvasSize.x * canvasDpi, y: canvasSize.y * canvasDpi})
        for (let xPosition = Math.floor(topLeftCornerOfCanvasInLocalReferenceFrame.x); xPosition <= Math.ceil(bottomRightCornerOfCanvasInLocalReferenceFrame.x); xPosition += 1) {
            for (let yPosition = Math.floor(topLeftCornerOfCanvasInLocalReferenceFrame.y); yPosition <= Math.ceil(bottomRightCornerOfCanvasInLocalReferenceFrame.y); yPosition += 1) {
                let dotRadius = 0.1
                if ((modulo(xPosition, 10) == 0) || (modulo(yPosition, 10) == 0)) {
                    dotRadius = 0.2
                }
                ctx.fillStyle = "brown"
                if ((xPosition == 0) || (yPosition == 0)) {
                    ctx.fillStyle = "black"
                }
                ctx.beginPath()
                ctx.arc(xPosition, yPosition, dotRadius, 0, 2 * Math.PI)
                ctx.fill()
            }
        }

        drawCirclesFillSolid(ctx, [
            {center: this.boundingBox.topLeft.toPoint(), outerDiameter: 2},
            {center: this.boundingBox.topRight.toPoint(), outerDiameter: 2},
            {center: this.boundingBox.bottomRight.toPoint(), outerDiameter: 2},
            {center: this.boundingBox.bottomLeft.toPoint(), outerDiameter: 2},
        ], 0.2, "purple")
    }

    setScaleBasedOnBoundingBox() {
        const left =   Math.min(this.boundingBox.topLeft.toPoint().x, this.boundingBox.topRight.toPoint().x, this.boundingBox.bottomRight.toPoint().x, this.boundingBox.bottomLeft.toPoint().x)
        const right =  Math.max(this.boundingBox.topLeft.toPoint().x, this.boundingBox.topRight.toPoint().x, this.boundingBox.bottomRight.toPoint().x, this.boundingBox.bottomLeft.toPoint().x)
        const top =    Math.min(this.boundingBox.topLeft.toPoint().y, this.boundingBox.topRight.toPoint().y, this.boundingBox.bottomRight.toPoint().y, this.boundingBox.bottomLeft.toPoint().y)
        const bottom = Math.max(this.boundingBox.topLeft.toPoint().y, this.boundingBox.topRight.toPoint().y, this.boundingBox.bottomRight.toPoint().y, this.boundingBox.bottomLeft.toPoint().y)

        const height = Math.abs(top - bottom)
        const width = Math.abs(right - left)
        const origin = {x: left + width / 2, y: top + height / 2}

        const scale = Math.min(canvasSize.x / width, canvasSize.y / height)
        const extraShift = {x: (canvasSize.x / scale - width) / 2, y: (canvasSize.y / scale - height) / 2}

        this.transformations[0].value = (new TransformationMatrix()).scale(canvasDpi * scale).translate(extraShift)
        this.transformations[1].value = (new TransformationMatrix()).translate({x: -origin.x + width / 2, y: -origin.y + height / 2})
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale / canvasDpi).multiply(this.originalTextTransformationMatrix)
    }
}
