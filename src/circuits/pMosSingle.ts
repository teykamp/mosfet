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
import { GndSymbol, VddSymbol } from '../classes/powerSymbols'

const usePmosSingle = () => {
    const circuit: Circuit = new Circuit({x: 0, y: 3}, 10, 20)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_drain": ref(new Node(2, false)),
        "M1_gate": ref(new Node(1, false)),
    }

    //////////////////////////////
    ///    TECTONIC PLATES     ///
    //////////////////////////////

    const tectonicPlate: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 4}, end: {x: 0, y: -2}}],
            between(gndVoltage, vddVoltage, circuit.nodes["M1_drain"].value.voltage) / (vddVoltage - gndVoltage))
    }))
    const tectonicPlateGnd: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return {x: 0, y: 4}
    }))
    const tectonicPlateChart: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return (circuit.devices.mosfets["M1"].selected.value) ? {x: 7, y: 0} : {x: 0, y: 0}
    }))

    circuit.boundingBox = [
        new TectonicPoint(circuit.transformations, {x: -5, y: -6}),
        new TectonicPoint(tectonicPlateChart.transformations, {x: 5, y: -6}),
        new TectonicPoint(tectonicPlateGnd.transformations, {x: -5, y: 12}),
        new TectonicPoint(tectonicPlateGnd.transformations, {x: 5, y: 12}),
    ]

    //////////////////////////////
    ///         MOSFETS        ///
    //////////////////////////////

    circuit.devices.mosfets = {
        "M1": new Mosfet(
            circuit.transformations,
            'pmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            3, 5, false, 'visible', 'visible', 'furtherGate'
        )
    }

    circuit.devices.mosfets["M1"].vgsChart.visibility = 'visible'
    circuit.devices.mosfets["M1"].vdsChart.visibility = 'visible'

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
        // [new GndSymbol(...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vminus"))],
        [new GndSymbol(tectonicPlateGnd.transformations, {x: 0, y: 8})],
        [new VddSymbol(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vs"))],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes["M1_drain"],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vplus")),
                ],
                voltageDisplayLabel: "Drain",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlate.transformations, {x: 0.5, y: 4.5})]
            },
            {
                node: circuit.nodes[gndNodeId],
                lines: [
                    new TectonicLine(tectonicPlateGnd.transformations, {x: 0, y: 8}, ...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vminus")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
        ]
    )

    circuit.finishSetup()
    return circuit
}
export default usePmosSingle
