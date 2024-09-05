import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { Schematic } from "./schematic"
import { VoltageSource } from "./voltageSource"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { canvasDpi, canvasSize, drawGrid, moveNodesInResponseToCircuitState, schematicScale } from "../constants"
import { modulo } from "../functions/extraMath"
import { drawCirclesFillSolid } from "../functions/drawFuncs"
import { TectonicPlate } from "./tectonicPlate"

export class Circuit extends CtxArtist {
    width: number
    height: number
    relativeOrigin: Point
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix

    constructor(origin: Point, width: number, height: number, schematic: Schematic = new Schematic(), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        const scale = Math.min(canvasSize.x / width, canvasSize.y / height)
        const extraShift = {x: (canvasSize.x / scale - width) / 2, y: (canvasSize.y / scale - height) / 2}
        super([], (new TransformationMatrix()).scale(scale * canvasDpi).translate({x: -origin.x + width / 2, y: -origin.y + height / 2}).translate(extraShift))

        this.width = width
        this.height = height
        this.relativeOrigin = origin
        this.schematic = schematic
        this.devices = {
            mosfets: mosfets,
            voltageSources: voltageSources,
        }
        this.nodes = nodes
        this.textTransformationMatrix = textTransformationMatrix.translate(origin).scale(scale / schematicScale)
    }

    get allSliders(): AngleSlider[] {
        return this.makeListOfSliders()
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()

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
            if (!slidersDragging) {
                TectonicPlate.allTectonicPlates.forEach((tectonicPlate: TectonicPlate) => {tectonicPlate.moveTowardDesiredLocation()})
            }
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
        const topLeftCornerOfCanvasInLocalReferenceFrame = CtxArtist.circuitTransformationMatrix.inverse().transformPoint({x: 0, y: 0})
        const bottomRightCornerOfCanvasInLocalReferenceFrame = CtxArtist.circuitTransformationMatrix.inverse().transformPoint(canvasSize)
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
        ctx.strokeStyle = "brown"
        ctx.lineWidth = 0.2
        ctx.strokeRect(this.relativeOrigin.x - this.width / 2, this.relativeOrigin.y - this.height / 2, this.width, this.height)
        drawCirclesFillSolid(ctx, [
            {center: this.relativeOrigin, outerDiameter: 3},
            {center: this.relativeOrigin, outerDiameter: 2},
            {center: this.relativeOrigin, outerDiameter: 1},
        ], 0.2, "purple")
    }
}
