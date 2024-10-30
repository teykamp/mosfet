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
import { Chart } from "./chart"

export class Circuit extends CtxArtist {
    boundingBox: TectonicPoint[]
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    selectedDevice: Mosfet | VoltageSource | null = null
    selectedDeviceBoundingBox: TectonicPoint[] = []
    selectedDeviceCharts: Chart[] = []
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

        this.setScaleBasedOnBoundingBox(ctx)
        this.transformationMatrix.transformCanvas(ctx)

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
        })
        Object.values(this.devices.voltageSources).forEach((voltageSource: VoltageSource) => {
            voltageSource.draw(ctx)
        })
        if (drawGrid.value) {
            this.drawGrid(ctx)
        }
        if (graphBarMosfetCtx.canvas.width == 0 || graphBarMosfetCtx.canvas.height == 0 || graphBarChartCtx.canvas.width == 0 || graphBarChartCtx.canvas.height == 0) {
            return
        }

        if (this.selectedDevice) {
            this.selectedDevice.transformations[0].value = this.calculateTransformationMatrixBasedOnBoundingBox(graphBarMosfetCtx, [
                    new TectonicPoint(this.transformations, {x: -130, y: 0}),
                    new TectonicPoint(this.transformations, {x: 130, y: 0}),
                    new TectonicPoint(this.transformations, {x: 0, y: -100}),
                    new TectonicPoint(this.transformations, {x: 0, y: 100}),
            ]).scale(schematicScale)
            CtxArtist.textTransformationMatrix.relativeScale = this.selectedDevice.transformationMatrix.relativeScale
            this.selectedDevice.draw(graphBarMosfetCtx)

            this.selectedDeviceCharts.forEach((chart: Chart) => {
                chart.transformations[0].value = this.calculateTransformationMatrixBasedOnBoundingBox(graphBarChartCtx, [
                    new TectonicPoint(this.transformations, {x: -150, y: 0}),
                    new TectonicPoint(this.transformations, {x: 150, y: 0}),
                    new TectonicPoint(this.transformations, {x: 0, y: -150}),
                    new TectonicPoint(this.transformations, {x: 0, y: 150}),
                ])
                CtxArtist.textTransformationMatrix.relativeScale = chart.transformationMatrix.relativeScale
                chart.draw(graphBarChartCtx)
            })
            // this.schematic.draw(graphBarMosfetCtx)
        }

        ctx.restore()
    }

    setSelectedDevice(device: Mosfet | VoltageSource) {
        this.selectedDevice = device.copy('mosfet')
        this.selectedDevice.isDuplicate = true

        if (this.selectedDevice instanceof Mosfet) {
            this.selectedDeviceCharts = [this.selectedDevice.vgsChart.copy('chart'), this.selectedDevice.vdsChart.copy('chart')]
        } else {
            this.selectedDeviceCharts = []
        }
    }

    resetSelectedDevice() {
        this.selectedDevice = null
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
        if (this.selectedDevice instanceof Mosfet) {
            allSliders.push(this.selectedDevice.vgs)
            allSliders.push(this.selectedDevice.vds)
            allSliders.push(this.selectedDeviceCharts[0])
            allSliders.push(this.selectedDeviceCharts[1])
        }
        for (const voltageSourceId in this.devices.voltageSources) {
            const voltageSource = this.devices.voltageSources[voltageSourceId]
            allSliders.push(voltageSource.voltageDrop)
        }
        if (this.selectedDevice instanceof VoltageSource) {
            allSliders.push(this.selectedDevice.voltageDrop)
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

    calculateTransformationMatrixBasedOnBoundingBox(ctx: CanvasRenderingContext2D, boundingBox: TectonicPoint[] = this.boundingBox): TransformationMatrix {
        const left =   Math.min(...boundingBox.map((point: TectonicPoint) => point.toPoint().x))
        const right =  Math.max(...boundingBox.map((point: TectonicPoint) => point.toPoint().x))
        const top =    Math.min(...boundingBox.map((point: TectonicPoint) => point.toPoint().y))
        const bottom = Math.max(...boundingBox.map((point: TectonicPoint) => point.toPoint().y))

        const height = Math.abs(top - bottom)
        const width = Math.abs(right - left)
        const origin = {x: left + width / 2, y: top + height / 2}

        const scale = Math.min((ctx.canvas.width / canvasDpi.value) / width, (ctx.canvas.height / canvasDpi.value) / height)
        const extraShift = {x: ((ctx.canvas.width / canvasDpi.value) / scale - width) / 2, y: ((ctx.canvas.height / canvasDpi.value) / scale - height) / 2}

        const transformationMatrix = (new TransformationMatrix()).scale(canvasDpi.value * scale).translate(extraShift).translate({x: -origin.x + width / 2, y: -origin.y + height / 2})
        return transformationMatrix
    }

    setScaleBasedOnBoundingBox(ctx: CanvasRenderingContext2D, boundingBox: TectonicPoint[] = this.boundingBox) {
        this.transformations[0].value = new TransformationMatrix()
        this.transformations[1].value = this.calculateTransformationMatrixBasedOnBoundingBox(ctx, boundingBox)
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale).multiply(this.originalTextTransformationMatrix)

        // set static transformation matrices for the circuit
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix
    }
}
