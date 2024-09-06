// import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { computed, ref } from 'vue'
// import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'
import { between } from '../functions/extraMath'
import { TectonicLine, TectonicPlate, TectonicPoint } from '../classes/tectonicPlate'
import { getPointAlongPath } from '../functions/drawFuncs'
import { GndSymbol } from '../classes/powerSymbols'
import { VddSymbol } from '../classes/powerSymbols'

const usePmosSingle = () => {
    const circuit: Circuit = new Circuit({x: 0, y: 3}, 10, 20)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_drain": ref(new Node(5, false)),
        "M1_gate": ref(new Node(1, false)),
    }

    //////////////////////////////
    ///    TECTONIC PLATES     ///
    //////////////////////////////

    const tectonicPlate: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 6}, end: {x: 0, y: 0}}],
            between(gndVoltage, vddVoltage, circuit.nodes["M1_drain"].value.voltage) / (vddVoltage - gndVoltage))
    }))

    //////////////////////////////
    ///         MOSFETS        ///
    //////////////////////////////

    circuit.devices.mosfets = {
        "M1": new Mosfet(
            // circuit.transformations,
            circuit.transformations,
            'pmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId]
        )
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "Vd": new VoltageSource(
            tectonicPlate.transformations,
            {x: 0, y: 6},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            "Vd",
            'gnd',
            true
        ),
    }

    //////////////////////////////
    ///        SCHEMATIC       ///
    //////////////////////////////

    circuit.schematic = new Schematic(
        circuit.transformations,
        [new GndSymbol(tectonicPlate.transformations, {x: 0, y: 8})],
        [new VddSymbol(circuit.transformations, circuit.devices.mosfets["M1"].getAnchorPoint("Vd"))],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes["M1_drain"],
                lines: [
                    new TectonicLine(circuit.transformations, {x: 0, y: 2}, tectonicPlate.transformations, {x: 0, y: 4}),
                ],
                voltageDisplayLabel: "Drain",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlate.transformations, {x: 0, y: 3})]
            }
        ]
    )

    circuit.boundingBox = {
        topLeft: new TectonicPoint(circuit.transformations, {x: -5, y: -4}),
        topRight: new TectonicPoint(circuit.transformations, {x: 5, y: -4}),
        bottomLeft: new TectonicPoint(tectonicPlate.transformations, {x: -5, y: 16}),
        bottomRight: new TectonicPoint(tectonicPlate.transformations, {x: 5, y: 16}),
    }

    return circuit
}
export default usePmosSingle
