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
import { moveNodesInResponseToCircuitState } from '../globalState'


const useNmos9TransistorOpAmp = () => {
    const circuit: Circuit = new Circuit('nMos9TransistorOpAmp', {x: 10, y: -2}, 50, 30)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_gate": ref(new Node(2, false)),
        "M1_drain": ref(new Node(4, false)),
        "M2_gate": ref(new Node(2, false)),
        "M2_drain": ref(new Node(4, false)),
        "M7_drain": ref(new Node(1, false)),
        "Mb_gate": ref(new Node(0.7, false)),
        "Vout": ref(new Node(4, false)),
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

    const tectonicPlateMaxM1M2: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return {x: 0, y: -3}
    }))

    const tectonicPlatePmos: TectonicPlate = new TectonicPlate(tectonicPlateMaxM1M2.transformations, computed(() => {
        let y_offset = 0
        if (circuit.devices.mosfets["M5"].showCharts.value || circuit.devices.mosfets["M6"].showCharts.value) {
            if (circuit.devices.mosfets["M2"].showCharts.value) {
                y_offset = -7
            } else {
                y_offset = -4
            }
        }
        if (moveNodesInResponseToCircuitState.value) {
            y_offset -= 3
        }
        return {x: 0, y: y_offset}
    }), true)

    const tectonicPlateOutput: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        let nChartsShown = [circuit.devices.mosfets["M2"].showCharts.value, circuit.devices.mosfets["M5"].showCharts.value, circuit.devices.mosfets["M6"].showCharts.value, circuit.devices.mosfets["Mb"].showCharts.value, circuit.devices.mosfets["M7"].showCharts.value].filter(Boolean).length
        if (nChartsShown == 0) {
            return {x: 0, y: 0}
        }
        if (nChartsShown == 1) {
            return {x: 5, y: 0}
        }
        if (circuit.devices.mosfets["Mb"].showCharts.value && circuit.devices.mosfets["M7"].showCharts.value) {
            return {x: 10, y: 0}
        }
        if (circuit.devices.mosfets["M5"].showCharts.value && circuit.devices.mosfets["M6"].showCharts.value) {
            return {x: 8, y: 0}
        }
        return {x: 5, y: 0}
    }), true)

    const tectonicPlatePmosOutput: TectonicPlate = new TectonicPlate(tectonicPlatePmos.transformations, computed(() => {
        return tectonicPlateOutput.desiredLocation.value
    }), true)

    const tectonicPlateVnode: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 0}, end: {x: 0, y: -8}}],
            between(gndVoltage, vddVoltage, circuit.nodes["Vnode"].value.voltage) / (vddVoltage - gndVoltage))
    }))

    const tectonicPlateVout: TectonicPlate = new TectonicPlate(tectonicPlateOutput.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 8.5}, end: (circuit.devices.mosfets["M5"].showCharts.value || circuit.devices.mosfets["M6"].showCharts.value) ? {x: 0, y: circuit.devices.mosfets["M2"].showCharts.value ? -20 : -15} : {x: 0, y: -9}}],
            between(gndVoltage, vddVoltage, circuit.nodes["Vout"].value.voltage) / (vddVoltage - gndVoltage))
    }))

    const tectonicPlateLowerCharts: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return (circuit.devices.mosfets["Mb"].showCharts.value || circuit.devices.mosfets["M7"].showCharts.value || circuit.devices.mosfets["M8"].showCharts.value) ? {x: 0, y: 2} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM1Chart: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return (circuit.devices.mosfets["M1"].showCharts.value) ? {x: -8, y: 0} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM3Chart: TectonicPlate = new TectonicPlate(tectonicPlatePmos.transformations, computed(() => {
        return (circuit.devices.mosfets["M3"].showCharts.value) ? {x: -3, y: -4} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM4Chart: TectonicPlate = new TectonicPlate(tectonicPlatePmosOutput.transformations, computed(() => {
        return (circuit.devices.mosfets["M4"].showCharts.value) ? {x: 2, y: -4} : {x: 0, y: 0}
    }), true)
    const tectonicPlateM8Chart: TectonicPlate = new TectonicPlate(tectonicPlateOutput.transformations, computed(() => {
        return (circuit.devices.mosfets["M8"].showCharts.value) ? {x: 2, y: 2} : {x: 0, y: 0}
    }), true)


    circuit.boundingBox = [
        new TectonicPoint(tectonicPlateM3Chart.transformations, {x: -12, y: -16}),
        new TectonicPoint(tectonicPlateM4Chart.transformations, {x: 33, y: -16}),
        new TectonicPoint(tectonicPlateLowerCharts.transformations, {x: -12, y: 12}),
        new TectonicPoint(tectonicPlateM1Chart.transformations, {x: -12, y: 0}),
        new TectonicPoint(tectonicPlateM8Chart.transformations, {x: 33, y: 12}),
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
            circuit.nodes["M1_drain"],
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
            circuit.nodes["M2_drain"],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'voltageSource'
        ),
        "M3": new Mosfet(
            tectonicPlatePmos.transformations,
            'pmos',
            -4,
            -12,
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'lowerBase'
        ),
        "M4": new Mosfet(
            tectonicPlatePmosOutput.transformations,
            'pmos',
            24,
            -12,
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["Vout"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            'locked',
            'locked',
            'lowerBase'
        ),
        "M5": new Mosfet(
            tectonicPlatePmos.transformations,
            'pmos',
            4,
            -7,
            circuit.nodes["M2_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M2_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'mirrorDriver'
        ),
        "M6": new Mosfet(
            tectonicPlatePmosOutput.transformations,
            'pmos',
            16,
            -7,
            circuit.nodes["M2_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M7_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            'locked',
            'locked',
            'mirrorReceiver'
        ),
        "M7": new Mosfet(
            tectonicPlateOutput.transformations,
            'nmos',
            16,
            6,
            circuit.nodes["M7_drain"],
            circuit.nodes[gndNodeId],
            circuit.nodes["M7_drain"],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            'locked',
            'locked',
            'lowerBase'
        ),
        "M8": new Mosfet(
            tectonicPlateOutput.transformations,
            'nmos',
            24,
            6,
            circuit.nodes["M7_drain"],
            circuit.nodes[gndNodeId],
            circuit.nodes["Vout"],
            circuit.nodes[gndNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            'locked',
            'locked',
            'lowerBase'
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
            new GndSymbol(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("SourceSupply")),
            new GndSymbol(...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("SourceSupply")),
            new GndSymbol(...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("gnd")),
            new GndSymbol(...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("gnd")),
            new GndSymbol(...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("gnd")),
        ],
        [
            new VddSymbol(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("SourceSupply")),
            new VddSymbol(...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("SourceSupply")),
            new VddSymbol(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("SourceSupply")),
            new VddSymbol(...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("SourceSupply")),
        ],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes[gndNodeId],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("SourceSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("SourceSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("SourceSupply")),
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
                    new TectonicLine(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("SourceSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("SourceSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("SourceSupply")),
                    new TectonicLine(...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("SourceSupply")),
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
            },
            {
            node: circuit.nodes["M1_drain"],
            lines: [
                    new TectonicLine(...circuit.devices.mosfets["M1"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vd")),
                    new TectonicLine(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vg_mirror_gate"), ...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                    new TectonicLine(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vg_mirror_drain"), ...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                    new TectonicLine(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vg")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M2_drain"],
                lines: [
                        new TectonicLine(...circuit.devices.mosfets["M2"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vd")),
                        new TectonicLine(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vg")),
                        new TectonicLine(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vg_mirror_gate"), ...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                        new TectonicLine(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vg_mirror_drain"), ...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                    ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M7_drain"],
                lines: [
                        new TectonicLine(...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vd")),
                        new TectonicLine(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vg"), ...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Vg")),
                        new TectonicLine(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vg_mirror_gate"), ...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                        new TectonicLine(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vg_mirror_drain"), ...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vg_mirror_corner")),
                    ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Vout"],
                lines: [
                        new TectonicLine(...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Vd"), ...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vd")),
                        new TectonicLine(tectonicPlateVout.transformations, {x: 24, y: -5}, tectonicPlateVout.transformations, {x: 28, y: -5}),
                    ],
                voltageDisplayLabel: "Vout",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlateVout.transformations, {x: 28.5, y: -5})]
            },
        ]
    )

    circuit.devices.mosfets["Mb"].adjacentDevices =        { 'up': 'M1', 'down': 'Vb', 'left': '',   'right': 'Vb' }
    circuit.devices.mosfets["M1"].adjacentDevices =        { 'up': 'M3', 'down': 'Mb', 'left': 'V1', 'right': 'M2' }
    circuit.devices.mosfets["M2"].adjacentDevices =        { 'up': 'M5', 'down': 'Mb', 'left': 'M1', 'right': 'V2' }
    circuit.devices.mosfets["M3"].adjacentDevices =        { 'up': '',   'down': 'M1', 'left': '',   'right': 'M4' }
    circuit.devices.mosfets["M4"].adjacentDevices =        { 'up': '',   'down': 'M8', 'left': 'M3', 'right': ''   }
    circuit.devices.mosfets["M5"].adjacentDevices =        { 'up': 'M3', 'down': 'M2', 'left': 'M3', 'right': 'M6' }
    circuit.devices.mosfets["M6"].adjacentDevices =        { 'up': 'M4', 'down': 'M7', 'left': 'M5', 'right': 'M4' }
    circuit.devices.mosfets["M7"].adjacentDevices =        { 'up': 'M6', 'down': '',   'left': 'V2', 'right': 'M8' }
    circuit.devices.mosfets["M8"].adjacentDevices =        { 'up': 'M4', 'down': '',   'left': 'M7', 'right': ''   }
    circuit.devices.voltageSources["Vb"].adjacentDevices = { 'up': 'Mb', 'down': '',   'left': 'Mb', 'right': 'M7' }
    circuit.devices.voltageSources["V1"].adjacentDevices = { 'up': 'M1', 'down': 'Mb', 'left': '',   'right': 'M1' }
    circuit.devices.voltageSources["V2"].adjacentDevices = { 'up': 'M2', 'down': 'Vb', 'left': 'M2', 'right': 'M7' }

    circuit.finishSetup()
    return circuit
}
export default useNmos9TransistorOpAmp
