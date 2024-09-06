import { Visibility } from '../types'
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


const useNmos9TransistorOpAmp = () => {
    const circuit: Circuit = new Circuit({x: 10, y: -2}, 50, 30)

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

    const tectonicPlatePmos: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return {x: 0, y: -4}
    }))

    const tectonicPlateOutput: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return {x: 10, y: 0}
    }))

    const tectonicPlatePmosOutput: TectonicPlate = new TectonicPlate(tectonicPlatePmos.transformations, computed(() => {
        return {x: 10, y: 0}
    }))

    const tectonicPlateVnode: TectonicPlate = new TectonicPlate(circuit.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 0}, end: {x: 0, y: -6}}],
            between(gndVoltage, vddVoltage, circuit.nodes["Vnode"].value.voltage) / (vddVoltage - gndVoltage))
    }))

    const tectonicPlateVout: TectonicPlate = new TectonicPlate(tectonicPlateOutput.transformations, computed(() => {
        return getPointAlongPath([{start: {x: 0, y: 8.5}, end: {x: 0, y: -9}}],
            between(gndVoltage, vddVoltage, circuit.nodes["Vout"].value.voltage) / (vddVoltage - gndVoltage))
    }))

    circuit.boundingBox = {
        topLeft: new TectonicPoint(tectonicPlatePmos.transformations, {x: -5, y: -18}),
        topRight: new TectonicPoint(tectonicPlatePmosOutput.transformations, {x: 25, y: -18}),
        bottomLeft: new TectonicPoint(circuit.transformations, {x: -5, y: 14}),
        bottomRight: new TectonicPoint(tectonicPlateOutput.transformations, {x: 25, y: 14}),
    }

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
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked
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
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
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
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
        ),
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "V1": new VoltageSource(
            tectonicPlateM1.transformations,
            {x: -8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": new VoltageSource(
            tectonicPlateM2.transformations,
            {x: 8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V2",
            'gnd'
        ),
        "Vb": new VoltageSource(
            circuit.transformations,
            {x: 4, y: 9},
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
            new GndSymbol(circuit.transformations, circuit.devices.mosfets["Mb"].getAnchorPoint("Gnd")),
            new GndSymbol(tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Gnd")),
            new GndSymbol(tectonicPlateOutput.transformations, circuit.devices.mosfets["M8"].getAnchorPoint("Gnd")),
            new GndSymbol(circuit.transformations, circuit.devices.voltageSources["Vb"].getAnchorPoint("Vminus")),
            new GndSymbol(tectonicPlateM1.transformations, circuit.devices.voltageSources["V1"].getAnchorPoint("Vminus")),
            new GndSymbol(tectonicPlateM2.transformations, circuit.devices.voltageSources["V2"].getAnchorPoint("Vminus")),
        ],
        [
            new VddSymbol(tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vdd")),
            new VddSymbol(tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M4"].getAnchorPoint("Vdd")),
            new VddSymbol(tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vdd")),
            new VddSymbol(tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M6"].getAnchorPoint("Vdd")),
        ],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes[gndNodeId],
                lines: [
                    new TectonicLine(circuit.transformations, circuit.devices.mosfets["Mb"].getAnchorPoint("Vs"), circuit.transformations, circuit.devices.mosfets["Mb"].getAnchorPoint("Gnd")),
                    new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vs"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Gnd")),
                    new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M8"].getAnchorPoint("Vs"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M8"].getAnchorPoint("Gnd")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes[vddNodeId],
                lines: [
                    new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vs"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vdd")),
                    new TectonicLine(tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M4"].getAnchorPoint("Vs"), tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M4"].getAnchorPoint("Vdd")),
                    new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vs"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vdd")),
                    new TectonicLine(tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M6"].getAnchorPoint("Vs"), tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M6"].getAnchorPoint("Vdd")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M1_gate"],
                lines: [
                    new TectonicLine(tectonicPlateM1.transformations, {x: -8, y: 1}, tectonicPlateM1.transformations, {x: -8, y: 0}),
                    new TectonicLine(tectonicPlateM1.transformations, {x: -8, y: 0}, tectonicPlateM1.transformations, {x: -6, y: 0}),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M2_gate"],
                lines: [
                    new TectonicLine(tectonicPlateM2.transformations, {x: 8, y: 1}, tectonicPlateM2.transformations, {x: 8, y: 0}),
                    new TectonicLine(tectonicPlateM2.transformations, {x: 8, y: 0}, tectonicPlateM2.transformations, {x: 6, y: 0}),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Mb_gate"],
                lines: [
                    new TectonicLine(circuit.transformations, {x: 4, y: 7}, circuit.transformations, {x: 4, y: 6}),
                    new TectonicLine(circuit.transformations, {x: 4, y: 6}, circuit.transformations, {x: 2, y: 6}),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Vnode"],
                lines: [
                    new TectonicLine(tectonicPlateVnode.transformations, {x: -4, y: 3}, tectonicPlateM1.transformations, circuit.devices.mosfets["M1"].getAnchorPoint("Vs")),
                    new TectonicLine(tectonicPlateVnode.transformations, {x:  4, y: 3}, tectonicPlateM2.transformations, circuit.devices.mosfets["M2"].getAnchorPoint("Vs")),
                    new TectonicLine(tectonicPlateVnode.transformations, {x: -4, y: 3}, tectonicPlateVnode.transformations, {x:  4, y: 3}),
                    new TectonicLine(circuit.transformations, circuit.devices.mosfets["Mb"].getAnchorPoint("Vd"), tectonicPlateVnode.transformations, {x:  0, y: 3}),
                ],
                voltageDisplayLabel: "V",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlateVnode.transformations, {x: -1, y: 2.5})]
            },
            {
            node: circuit.nodes["M1_drain"],
            lines: [
                    new TectonicLine(tectonicPlateM1.transformations, circuit.devices.mosfets["M1"].getAnchorPoint("Vd"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vd")),
                    new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vg_mirror_gate"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vg_mirror_corner")),
                    new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vg_mirror_drain"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vg_mirror_corner")),
                    new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M3"].getAnchorPoint("Vg"), tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M4"].getAnchorPoint("Vg")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M2_drain"],
                lines: [
                        new TectonicLine(tectonicPlateM2.transformations, circuit.devices.mosfets["M2"].getAnchorPoint("Vd"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vd")),
                        new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vg"), tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M6"].getAnchorPoint("Vg")),
                        new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vg_mirror_gate"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vg_mirror_corner")),
                        new TectonicLine(tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vg_mirror_drain"), tectonicPlatePmos.transformations, circuit.devices.mosfets["M5"].getAnchorPoint("Vg_mirror_corner")),
                    ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["M7_drain"],
                lines: [
                        new TectonicLine(tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M6"].getAnchorPoint("Vd"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vd")),
                        new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vg"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M8"].getAnchorPoint("Vg")),
                        new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vg_mirror_gate"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vg_mirror_corner")),
                        new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vg_mirror_drain"), tectonicPlateOutput.transformations, circuit.devices.mosfets["M7"].getAnchorPoint("Vg_mirror_corner")),
                    ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes["Vout"],
                lines: [
                        new TectonicLine(tectonicPlateOutput.transformations, circuit.devices.mosfets["M8"].getAnchorPoint("Vd"), tectonicPlatePmosOutput.transformations, circuit.devices.mosfets["M4"].getAnchorPoint("Vd")),
                        new TectonicLine(tectonicPlateVout.transformations, {x: 24, y: -5}, tectonicPlateVout.transformations, {x: 28, y: -5}),
                    ],
                voltageDisplayLabel: "Vout",
                voltageDisplayLocations: [new TectonicPoint(tectonicPlateVout.transformations, {x: 28.5, y: -5})]
            },
        ]
    )
    return circuit
}
export default useNmos9TransistorOpAmp
