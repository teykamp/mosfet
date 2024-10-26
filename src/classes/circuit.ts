import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ref, Ref } from 'vue'
import { Schematic } from "./schematic"
import { VoltageSource } from "./voltageSource"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { schematicScale } from "../constants"
import { canvasSize } from '../globalState'
import { modulo } from "../functions/extraMath"
import { drawCirclesFillSolid } from "../functions/drawFuncs"
import { TectonicPlate, TectonicPoint } from "./tectonicPlate"
import { CtxSlider } from "./ctxSlider"
import { canvasDpi, drawGrid, moveNodesInResponseToCircuitState } from "../globalState"

export class Circuit extends CtxArtist {
    boundingBox: TectonicPoint[]
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix
    originalTextTransformationMatrix: TransformationMatrix

    constructor(origin: Point, width: number, height: number, schematic: Schematic = new Schematic(), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        const scale = Math.min(canvasSize.value.width / width, canvasSize.value.height / height)
        const extraShift = {x: (canvasSize.value.width / scale - width) / 2, y: (canvasSize.value.height / scale - height) / 2}
        super([ref((new TransformationMatrix()).scale(canvasDpi.value * scale).translate(extraShift)) as Ref<TransformationMatrix>], (new TransformationMatrix()).translate({x: -origin.x + width / 2, y: -origin.y + height / 2}))

        this.boundingBox = [
            new TectonicPoint(this.transformations, {x: origin.x - width / 2, y: origin.y - height / 2}),
            new TectonicPoint(this.transformations, {x: origin.x + width / 2, y: origin.y - height / 2}),
            new TectonicPoint(this.transformations, {x: origin.x - width / 2, y: origin.y + height / 2}),
            new TectonicPoint(this.transformations, {x: origin.x + width / 2, y: origin.y + height / 2}),
        ]

        this.schematic = schematic
        this.devices = {
            mosfets: mosfets,
            voltageSources: voltageSources,
        }
        this.nodes = nodes
        this.originalTextTransformationMatrix = textTransformationMatrix
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale).multiply(this.originalTextTransformationMatrix)

        // set static transformation matrices for the circuit // must be applied during construction because it will be used immediately as other elements of the circuit are defined immediately after its definition
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix
    }

    get allSliders(): CtxSlider[] {
        return this.makeListOfSliders()
    }

    draw(ctx: CanvasRenderingContext2D, graphBarMosfetCtx: CanvasRenderingContext2D, graphBarChartCtx: CanvasRenderingContext2D) {
        ctx.save()

        this.setScaleBasedOnBoundingBox()
        this.transformationMatrix.transformCanvas(ctx)

        // set static transformation matrices for the circuit
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix

        if (moveNodesInResponseToCircuitState.value) {
            // let slidersDragging = false
            // this.allSliders.forEach((slider: CtxSlider) => {
            //     if (slider.dragging) {
            //         slidersDragging = true
            //     }
            // })
            // if (!slidersDragging) {
                TectonicPlate.allTectonicPlates.forEach((tectonicPlate: TectonicPlate) => {tectonicPlate.moveTowardDesiredLocation()})
            // }
        } else {
            TectonicPlate.allTectonicPlates.forEach((tectonicPlate: TectonicPlate) => {tectonicPlate.moveTowardLocation({x: 0, y: 0})})
        }

        this.schematic.draw(ctx)
        Object.values(this.devices.mosfets).forEach((mosfet: Mosfet) => {
            mosfet.draw(ctx)
            if (mosfet.selectedFocus.value) {
                console.log(mosfet.transformationMatrix.matrix.values)
                graphBarMosfetCtx.arc(0, 0, 10, 0, 2 * Math.PI)
                graphBarMosfetCtx.fillStyle = 'red'
                graphBarMosfetCtx.fill()
                mosfet.draw(graphBarMosfetCtx, (new TransformationMatrix).translate({x: 200, y: 200}))
                mosfet.vgsChart.draw(graphBarChartCtx, (new TransformationMatrix).translate({x: 200, y: 200}))
                mosfet.vdsChart.draw(graphBarChartCtx, (new TransformationMatrix).translate({x: 200, y: 200}))
            }
        })
        Object.values(this.devices.voltageSources).forEach((voltageSource: VoltageSource) => {voltageSource.draw(ctx)})

        if (drawGrid.value) {
            this.drawGrid(ctx)
        }

        ctx.restore()
    }

    makeListOfSliders(): CtxSlider[] {
        const allSliders: CtxSlider[] = []
        for (const mosfetId in this.devices.mosfets) {
            const mosfet = this.devices.mosfets[mosfetId]
            allSliders.push(mosfet.vgs)
            allSliders.push(mosfet.vds)
            allSliders.push(mosfet.vgsChart)
            allSliders.push(mosfet.vdsChart)
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
        const bottomRightCornerOfCanvasInLocalReferenceFrame = this.transformationMatrix.inverse().transformPoint({ x: canvasSize.value.width * canvasDpi.value, y: canvasSize.value.height * canvasDpi.value})
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

        drawCirclesFillSolid(ctx, this.boundingBox.map((point: TectonicPoint) => {return {center: point.toPoint(), outerDiameter: 2}}), 0.2, "purple")
    }

    setScaleBasedOnBoundingBox() {
        const left =   Math.min(...this.boundingBox.map((point: TectonicPoint) => point.toPoint().x))
        const right =  Math.max(...this.boundingBox.map((point: TectonicPoint) => point.toPoint().x))
        const top =    Math.min(...this.boundingBox.map((point: TectonicPoint) => point.toPoint().y))
        const bottom = Math.max(...this.boundingBox.map((point: TectonicPoint) => point.toPoint().y))

        const height = Math.abs(top - bottom)
        const width = Math.abs(right - left)
        const origin = {x: left + width / 2, y: top + height / 2}

        const scale = Math.min(canvasSize.value.width / width, canvasSize.value.height / height)
        const extraShift = {x: (canvasSize.value.width / scale - width) / 2, y: (canvasSize.value.height / scale - height) / 2}

        this.transformations[0].value = (new TransformationMatrix()).scale(canvasDpi.value * scale).translate(extraShift)
        this.transformations[1].value = (new TransformationMatrix()).translate({x: -origin.x + width / 2, y: -origin.y + height / 2})
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale).multiply(this.originalTextTransformationMatrix)
    }
}
