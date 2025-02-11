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

const useNmosDiffPair = () => {
    const circuit: Circuit = new Circuit('nMosDiffPair', {x: 0, y: 4}, 25, 20)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_gate": ref(new Node(2, false)),
        "M2_gate": ref(new Node(2, false)),
        "Mb_gate": ref(new Node(0.7, false)),
        "Vnode": ref(new Node(1, false)),
    }

    //////////////////////////////
    ///    TECTONIC PLATES     ///
    //////////////////////////////

    const tectonicPlateM1: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 1}, end: {x: 0, y: -7}}],
            between(gndVoltage, vddVoltage, Math.max(circuit.nodes["M1_gate"].value.voltage, circuit.nodes["Vnode"].value.voltage)) / (vddVoltage - gndVoltage))
    }))

    const tectonicPlateM2: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 1}, end: {x: 0, y: -7}}],
            between(gndVoltage, vddVoltage, Math.max(circuit.nodes["M2_gate"].value.voltage, circuit.nodes["Vnode"].value.voltage)) / (vddVoltage - gndVoltage))
        }))

        const tectonicPlateVnode: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
            return getPointAlongPath([{start: {x: 0, y: 0}, end: {x: 0, y: -8}}],
                between(gndVoltage, vddVoltage, circuit.nodes["Vnode"].value.voltage) / (vddVoltage - gndVoltage))
            }))

    const tectonicPlateMbChart: TectonicPlate = new TectonicPlate(tectonicPlateM1.transformations, computed(() => {
        return (circuit.devices.mosfets["Mb"].showCharts.value) ? {x: 5, y: 2} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM1Chart: TectonicPlate = new TectonicPlate(tectonicPlateM1.transformations, computed(() => {
        return (circuit.devices.mosfets["M1"].showCharts.value) ? {x: -8, y: 0} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM2Chart: TectonicPlate = new TectonicPlate(tectonicPlateM2.transformations, computed(() => {
        return (circuit.devices.mosfets["M2"].showCharts.value) ? {x: 8, y: 0} : {x: 0, y: 0}
    }), true)

    circuit.boundingBox = [
        new TectonicPoint(tectonicPlateM1Chart.transformations, {x: -11, y: -6}),
        new TectonicPoint(tectonicPlateM2Chart.transformations, {x: 11, y: -6}),
        new TectonicPoint(circuit.transformations, {x: -12, y: 13}),
        new TectonicPoint(circuit.transformations, {x: 12, y: 13}),
        new TectonicPoint(tectonicPlateMbChart.transformations, {x: 11, y: 13}),
    ]


    //////////////////////////////
    ///         MOSFETS        ///
    //////////////////////////////

    circuit.devices.mosfets = {
        "Mb": new Mosfet(
            circuit.transformations,
            'nmos',
            0,
            6,
            circuit.nodes["Mb_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["Vnode"],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'lowerVoltageSource'
        ),
        "M1": new Mosfet(
            tectonicPlateM1.transformations,
            'nmos',
            -4,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            'locked',
            'locked',
            'voltageSource'
        ),
        "M2": new Mosfet(
            tectonicPlateM2.transformations,
            'nmos',
            4,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'voltageSource'
        ),
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "V1": new VoltageSource(
            ...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vg_drive_Vsource"),
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": new VoltageSource(
            ...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vg_drive_Vsource"),
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V2",
            'gnd'
        ),
        "Vb": new VoltageSource(
            ...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vg_drive_Vsource"),
            circuit.nodes[gndNodeId],
            circuit.nodes["Mb_gate"],
            "Vb",
            'gnd'
        ),
    }

    //////////////////////////////
    ///        SCHEMATIC       ///
    //////////////////////////////

    circuit.schematic = new Schematic(
        circuit.transformations,
        [
            new GndSymbol(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("SourceSupply")),
            new GndSymbol(...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("gnd")),
            new GndSymbol(...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("gnd")),
            new GndSymbol(...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("gnd")),
        ],
        [
            new VddSymbol(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("DrainSupply")),
            new VddSymbol(...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("DrainSupply")),
        ],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes[gndNodeId],
                lines: [
                    new TectonicLine(circuit.transformations, {x: 0, y: 8}, circuit.transformations, {x: 0, y: 9}),
                    new TectonicLine(...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("Vminus"), ...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("gnd")),
                    new TectonicLine(...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("Vminus"), ...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("gnd")),
                    new TectonicLine(...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("Vminus"), ...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("gnd")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes[vddNodeId],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("DrainSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("DrainSupply")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M1_gate"],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vg_drive_gate")),
                    new TectonicLine(...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("Vplus"), ...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vg_drive_gate")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M2_gate"],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vg_drive_gate")),
                    new TectonicLine(...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("Vplus"), ...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vg_drive_gate")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Mb_gate"],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vg_drive_gate")),
                    new TectonicLine(...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("Vplus"), ...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vg_drive_gate")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Vnode"],
                lines: [
                    new TectonicLine(tectonicPlateVnode.transformations, {x: -4, y: 3}, ...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vs")),
                    new TectonicLine(tectonicPlateVnode.transformations, {x:  4, y: 3}, ...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vs")),
                    new TectonicLine(tectonicPlateVnode.transformations, {x: -4, y: 3}, tectonicPlateVnode.transformations, {x:  4, y: 3}),
                    new TectonicLine(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vd"), tectonicPlateVnode.transformations, {x:  0, y: 3}),
                ],
                voltageDisplayLabel: "V",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlateVnode.transformations, {x: -1, y: 2.5})]
            }
        ]
    )

    circuit.devices.mosfets["M1"].adjacentDevices =        { 'up': '',   'down': 'Mb', 'left': 'V1', 'right': 'M2' }
    circuit.devices.mosfets["Mb"].adjacentDevices =        { 'up': 'M1', 'down': 'Vb', 'left': '',   'right': 'Vb' }
    circuit.devices.mosfets["M2"].adjacentDevices =        { 'up': '',   'down': 'Mb', 'left': 'M1', 'right': 'V2' }
    circuit.devices.voltageSources["Vb"].adjacentDevices = { 'up': 'Mb', 'down': '',   'left': 'Mb', 'right': ''   }
    circuit.devices.voltageSources["V1"].adjacentDevices = { 'up': 'M1', 'down': 'Mb', 'left': '',   'right': 'M1' }
    circuit.devices.voltageSources["V2"].adjacentDevices = { 'up': 'M2', 'down': 'Vb', 'left': 'M2', 'right': ''   }

    circuit.finishSetup()
    return circuit
}
export default useNmosDiffPair
