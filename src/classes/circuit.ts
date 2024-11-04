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

    selectedDeviceCharts: Chart[] = []
    selectedDeviceChartsBoundingBox: TectonicPoint[]
    selectedDeviceChartsTransformationMatrix: Ref<TransformationMatrix> = ref(new TransformationMatrix()) as Ref<TransformationMatrix>

    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix
    originalTextTransformationMatrix: TransformationMatrix
    circuitCopy: CircuitCopy | null
    anyDevicesSelected: boolean = false
    moveTectonicPlatesWhileDragging: boolean = true

    constructor(origin: Point, width: number, height: number, schematic: Schematic = new Schematic(), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        // const scale = Math.min(canvasSize.value.width / width, canvasSize.value.height / height) // TODO: Can probably delete, since this gets set elsewhere
        // const extraShift = {x: (canvasSize.value.width / scale - width) / 2, y: (canvasSize.value.height / scale - height) / 2} // TODO: Can probably delete, since this gets set elsewhere
        super([ref((new TransformationMatrix())/*.scale(canvasDpi.value * scale).translate(extraShift)*/) as Ref<TransformationMatrix>], (new TransformationMatrix()).translate({x: -origin.x + width / 2, y: -origin.y + height / 2}))

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

        this.circuitCopy = this.copy()

        this.selectedDeviceChartsBoundingBox = [
            new TectonicPoint(this.transformations, {x: -120, y: 0}),
            new TectonicPoint(this.transformations, {x: 120, y: 0}),
            new TectonicPoint(this.transformations, {x: 0, y: -120}),
            new TectonicPoint(this.transformations, {x: 0, y: 120}),
        ]

        // set static transformation matrices for the circuit // must be applied during construction because it will be used immediately as other elements of the circuit are defined immediately after its definition
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix
    }

    assignKeysToDevices() {
        Object.entries(this.devices.mosfets).forEach(([key, mosfet]: [string, Mosfet]) => {mosfet.key = key})
        Object.entries(this.devices.voltageSources).forEach(([key, voltageSource]: [string, VoltageSource]) => {voltageSource.key = key})
    }

    finishSetup() {
        this.assignKeysToDevices()
        this.circuitCopy = this.copy()
        this.circuitCopy?.assignKeysToDevices()
    }

    get allSliders(): CtxSlider[] {
        return this.makeListOfSliders()
    }

    get anySlidersDragging() {
        let flag = false
        this.allSliders.forEach(slider => {
            if (slider.dragging) {
                flag = true
            }
            })
        return flag
    }

    copy(): CircuitCopy | null {
        const parentTransformation = ref(new TransformationMatrix()) as Ref<TransformationMatrix>
        const newCircuit = new CircuitCopy(
            {x: 0, y: 0},
            10,
            10,
            this.schematic.copy(parentTransformation),
            Object.fromEntries(Object.entries(this.devices.mosfets).map(([name, mosfet]: [string, Mosfet]) => [name, mosfet.copy(parentTransformation, 'mosfet')])),
            Object.fromEntries(Object.entries(this.devices.voltageSources).map(([name, voltageSource]: [string, VoltageSource]) => [name, voltageSource.copy(parentTransformation, 'mosfet')])),
            this.nodes,
            this.textTransformationMatrix
        )
        newCircuit.transformations[0] = parentTransformation
        return newCircuit
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()

        this.setScaleBasedOnBoundingBox(ctx)
        this.transformationMatrix.transformCanvas(ctx)

        if (moveNodesInResponseToCircuitState.value) {
            if (!this.anySlidersDragging || this.moveTectonicPlatesWhileDragging) {
                TectonicPlate.allTectonicPlates.forEach((tectonicPlate: TectonicPlate) => {tectonicPlate.moveTowardDesiredLocation()})
            }
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
        ctx.restore()
    }

    drawSelectedDeviceCharts(ctx: CanvasRenderingContext2D) {
        const chartTransformationMatrix = this.calculateTransformationMatrixBasedOnBoundingBox(ctx, this.selectedDeviceChartsBoundingBox)
        this.selectedDeviceChartsTransformationMatrix.value = chartTransformationMatrix
        CtxArtist.textTransformationMatrix.relativeScale = chartTransformationMatrix.relativeScale
        this.selectedDeviceCharts.forEach((chart: Chart) => {
            chart.draw(ctx)
        })
    }

    setSelectedDevice(device: Mosfet | VoltageSource) {
        if (!this.circuitCopy) {
            return
        }
        this.circuitCopy.boundingBox = device.boundingBox
        this.anyDevicesSelected = true

        if (!this.circuitCopy) {
            return
        }

        if (device instanceof Mosfet) {
            const mosfet = this.circuitCopy.devices.mosfets[device.key]
            mosfet.vgs.visibility = device.vgs.visibility
            mosfet.vds.visibility = device.vds.visibility
            mosfet.vgsChart.visibility = 'hidden' // do not draw the charts
            mosfet.vdsChart.visibility = 'hidden' // do not draw the charts

            this.selectedDeviceCharts = [device.vgsChart.copy(this.selectedDeviceChartsTransformationMatrix, 'chart'), device.vdsChart.copy(this.selectedDeviceChartsTransformationMatrix, 'chart')]

        } else if (device instanceof VoltageSource) {
            const voltageSource = this.circuitCopy.devices.voltageSources[device.key]
            voltageSource.voltageDrop.visibility = device.voltageDrop.visibility
        }
    }

    resetSelectedDevice() {
        this.selectedDeviceCharts = []
        this.anyDevicesSelected = false

        if (!this.circuitCopy) {
            return
        }
        this.circuitCopy.allSliders.forEach((slider: CtxSlider) => {slider.visibility = 'hidden'})
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

        this.selectedDeviceCharts.forEach((chart: Chart) => {allSliders.push(chart)})

        if (this.circuitCopy) {
            return allSliders.concat(this.circuitCopy.allSliders)
        } else {
            return allSliders
        }
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)
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

        const canvasWidth = Math.max(ctx.canvas.width, 1)
        const canvasHeight = Math.max(ctx.canvas.height, 1)

        const scale = Math.min((canvasWidth / canvasDpi.value) / width, (canvasHeight / canvasDpi.value) / height)
        const extraShift = {x: ((canvasWidth / canvasDpi.value) / scale - width) / 2, y: ((canvasHeight / canvasDpi.value) / scale - height) / 2}

        const transformationMatrix = (new TransformationMatrix()).scale(canvasDpi.value * scale).translate(extraShift).translate({x: -origin.x + width / 2, y: -origin.y + height / 2})
        return transformationMatrix
    }

    setScaleBasedOnBoundingBox(ctx: CanvasRenderingContext2D, boundingBox: TectonicPoint[] = this.boundingBox) {
        this.transformations[1].value = new TransformationMatrix()
        this.transformations[0].value = this.calculateTransformationMatrixBasedOnBoundingBox(ctx, boundingBox)
        this.textTransformationMatrix = this.transformationMatrix.scale(1 / schematicScale).multiply(this.originalTextTransformationMatrix)
        this.setCtxArtistScale()
    }

    setCtxArtistScale() {  // set static transformation matrices for the circuit
        CtxArtist.circuitTransformationMatrix = this.transformationMatrix
        CtxArtist.textTransformationMatrix = this.textTransformationMatrix
    }
}

class CircuitCopy extends Circuit {
    override copy(): CircuitCopy | null {
        return null
    }
    override setCtxArtistScale() {}
}
