import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { Schematic } from "./schematic"
import { VoltageSource } from "./voltageSource"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { canvasSize, drawGrid, schematicScale } from "../constants"
import { modulo } from "../functions/extraMath"

export class Circuit extends CtxArtist {
    width: number
    height: number
    relativeOrigin: Point
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    // allSliders: AngleSlider[] // a list of all the AngleSliders belonging to all of the devices, to make it easier to loop over them
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix

    constructor(origin: Point, width: number, height: number, schematic: Schematic = new Schematic(new TransformationMatrix(), [], [], [], [], []), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        const scale = Math.min(canvasSize.x / width, canvasSize.y / height)
        super((new TransformationMatrix()).scale(scale).translate({x: -(origin.x) + width / 2, y: -(origin.y) + height / 2}))

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
        this.transformationMatrix.transformCanvas(ctx)

        // set static transformation matrices for the circuit
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix

        this.schematic.draw(ctx)
        Object.values(this.devices.mosfets).forEach((mosfet: Mosfet) => {mosfet.draw(ctx)})
        Object.values(this.devices.voltageSources).forEach((voltageSource: VoltageSource) => {voltageSource.draw(ctx)})

        if (drawGrid) {
            this.drawGrid(ctx)
        }
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

    drawGrid(ctx: CanvasRenderingContext2D, width: number = 40, height: number = 20) {
        CtxArtist.circuitTransformationMatrix.transformCanvas(ctx)
        const topLeftCornerOfCanvasInLocalReferenceFrame = CtxArtist.circuitTransformationMatrix.inverse().transformPoint({x: 0, y: 0})
        const bottomRightCornerOfCanvasInLocalReferenceFrame = CtxArtist.circuitTransformationMatrix.inverse().transformPoint(canvasSize)
        console.log(topLeftCornerOfCanvasInLocalReferenceFrame.x, topLeftCornerOfCanvasInLocalReferenceFrame.y)
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
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(this.relativeOrigin.x, this.relativeOrigin.y)
        ctx.stroke()
    }
}
