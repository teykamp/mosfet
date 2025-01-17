// import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { computed, ref } from 'vue'
// import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'
import { TectonicLine, TectonicPlate, TectonicPoint } from '../classes/tectonicPlate'
import { getPointAlongPath } from '../functions/drawFuncs'
import { between } from '../functions/extraMath'
import { GndSymbol, VddSymbol } from '../classes/powerSymbols'

const useNmosSingle = () => {
    const circuit: Circuit = new Circuit('nMosSingle', {x: 0, y: -3}, 10, 20)

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
        return getPointAlongPath([{start: {x: 0, y: 2}, end: {x: 0, y: -4}}],
            between(gndVoltage, vddVoltage, circuit.nodes["M1_drain"].value.voltage) / (vddVoltage - gndVoltage))
    }))
    const tectonicPlateVdd: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return {x: 0, y: -4}
    }))
    const tectonicPlateChart: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return (circuit.devices.mosfets["M1"].showCharts.value) ? {x: 7, y: 0} : {x: 0, y: 0}
    }))

    circuit.boundingBox = [
        new TectonicPoint(tectonicPlateVdd.transformations, {x: -5, y: -12}),
        new TectonicPoint(tectonicPlate.transformations, {x: 5, y: -12}),
        new TectonicPoint(circuit.transformations, {x: -5, y: 6}),
        new TectonicPoint(tectonicPlateChart.transformations, {x: 5, y: 6}),
    ]

    //////////////////////////////
    ///         MOSFETS        ///
    //////////////////////////////

    circuit.devices.mosfets = {
        "M1": new Mosfet(
            circuit.transformations,
            'nmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            3, 5, false, 'visible', 'visible', 'furtherGate'
        )
    }

    circuit.devices.mosfets["M1"].vgsChart.originalVisibility = 'visible'
    circuit.devices.mosfets["M1"].vdsChart.originalVisibility = 'visible'


    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "Vd": new VoltageSource(
            tectonicPlate.transformations,
            {x: 0, y: -6},
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            "Vdd-Vd",
            'vdd',
            true
        ),
    }

    //////////////////////////////
    ///        SCHEMATIC       ///
    //////////////////////////////

    circuit.schematic = new Schematic(
        circuit.transformations,
        [new GndSymbol(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vs"))],
        // [new VddSymbol(...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vplus"))],
        [new VddSymbol(tectonicPlateVdd.transformations, {x: 0, y: -8})],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes["M1_drain"],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vminus")),
                ],
                voltageDisplayLabel: "Drain",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlate.transformations, {x: 0.5, y: -4})]
            },
            {
                node: circuit.nodes[vddNodeId],
                lines: [
                    new TectonicLine(tectonicPlateVdd.transformations, {x: 0, y: -8}, ...circuit.devices.voltageSources["Vd"].getAnchorPointWithTransformations("Vplus")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
        ]
    )

    circuit.devices.mosfets["M1"].adjacentDevices = {'up': 'Vd'}
    circuit.devices.voltageSources["Vd"].adjacentDevices = {'down': 'M1'}

    circuit.finishSetup()
    return circuit
}
export default useNmosSingle
