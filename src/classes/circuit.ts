import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { Schematic } from "./schematic"
import { VoltageSource } from "./voltageSource"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { schematicScale } from "../constants"

export class Circuit extends CtxArtist{
    schematic: Schematic // how to draw the circuit
    devices: {
      mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
      voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
    }
    // allSliders: AngleSlider[] // a list of all the AngleSliders belonging to all of the devices, to make it easier to loop over them
    nodes: {[nodeId: string]: Ref<Node>} // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
    textTransformationMatrix: TransformationMatrix

    constructor(origin: Point, scale: number, schematic: Schematic = new Schematic(new TransformationMatrix(), [], [], [], [], []), mosfets: {[name: string]: Mosfet} = {}, voltageSources: {[name: string]: VoltageSource} = {}, nodes: {[nodeId: string]: Ref<Node>} = {}, textTransformationMatrix = new TransformationMatrix()) {
        super((new TransformationMatrix()).translate(origin).scale(schematicScale * scale))
        console.log(this.transformationMatrix)
        this.schematic = schematic
        this.devices = {
            mosfets: mosfets,
            voltageSources: voltageSources,
        }
        this.nodes = nodes
        this.textTransformationMatrix = textTransformationMatrix.translate(origin).scale(scale)
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
}
