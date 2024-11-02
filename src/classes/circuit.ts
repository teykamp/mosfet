import { Point, Visibility } from "../types"
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
import { AngleSlider } from "./angleSlider"

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
    selectedSchematic: Schematic | null = null
    selectedSchematicOrigin: TectonicPoint = new TectonicPoint([], {x: 0, y: 0})
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix
    originalTextTransformationMatrix: TransformationMatrix
    circuitCopy: CircuitCopy | null

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
            console.log(this)
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

    setSelectedDevice(device: Mosfet | VoltageSource) {
        if (!this.circuitCopy) {
            return
        }
        this.circuitCopy.boundingBox = [
            new TectonicPoint(device.transformations, {x: -100, y: 0}),
            new TectonicPoint(device.transformations, {x: 100, y: 0}),
            new TectonicPoint(device.transformations, {x: 0, y: -100}),
            new TectonicPoint(device.transformations, {x: 0, y: 100}),
        ]

        if (!this.circuitCopy) {
            return
        }

        if (device instanceof Mosfet) {
            const mosfet = this.circuitCopy.devices.mosfets[device.key]
            mosfet.vgs.visibility = device.vgs.visibility
            mosfet.vds.visibility = device.vds.visibility
            mosfet.vgsChart.visibility = device.vgsChart.visibility
            mosfet.vdsChart.visibility = device.vdsChart.visibility
        } else if (device instanceof VoltageSource) {
            const voltageSource = this.circuitCopy.devices.voltageSources[device.key]
            voltageSource.voltageDrop.visibility = device.voltageDrop.visibility
        }
    }

    resetSelectedDevice() {
        this.selectedDevice = null
        this.selectedDeviceCharts = []
        this.selectedSchematic = null

        if (!this.circuitCopy) {
            return
        }
        this.circuitCopy.allSliders.forEach((slider: CtxSlider) => {slider.visibility = Visibility.Hidden})
        // Object.values(this.devices.mosfets).forEach((mosfet: Mosfet) => {
        //     mosfet.vgs.visibility = Visibility.Hidden
        //     mosfet.vds.visibility = Visibility.Hidden
        //     mosfet.vgsChart.visibility = Visibility.Hidden
        //     mosfet.vdsChart.visibility = Visibility.Hidden
        // })
        // Object.values(this.circuitCopy.devices.voltageSources).forEach((voltageSource: VoltageSource) => {
        //     voltageSource.voltageDrop.visibility = Visibility.Hidden
        // })
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

    setCtxArtistScale() {
        // set static transformation matrices for the circuit
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
