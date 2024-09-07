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
        topLeft: new TectonicPoint(tectonicPlatePmos.transformations, {x: -12, y: -18}),
        topRight: new TectonicPoint(tectonicPlatePmosOutput.transformations, {x: 33, y: -18}),
        bottomLeft: new TectonicPoint(circuit.transformations, {x: -12, y: 14}),
        bottomRight: new TectonicPoint(tectonicPlateOutput.transformations, {x: 33, y: 14}),
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
            new GndSymbol(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Gnd")),
            new GndSymbol(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Gnd")),
            new GndSymbol(...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Gnd")),
            new GndSymbol(...circuit.devices.voltageSources["Vb"].getAnchorPointWithTransformations("Vminus")),
            new GndSymbol(...circuit.devices.voltageSources["V1"].getAnchorPointWithTransformations("Vminus")),
            new GndSymbol(...circuit.devices.voltageSources["V2"].getAnchorPointWithTransformations("Vminus")),
        ],
        [
            new VddSymbol(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vdd")),
            new VddSymbol(...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vdd")),
            new VddSymbol(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vdd")),
            new VddSymbol(...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vdd")),
        ],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes),
        [
            {
                node: circuit.nodes[gndNodeId],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["Mb"].getAnchorPointWithTransformations("Gnd")),
                    new TectonicLine(...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M7"].getAnchorPointWithTransformations("Gnd")),
                    new TectonicLine(...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M8"].getAnchorPointWithTransformations("Gnd")),
                ],
                voltageDisplayLabel: "",
                voltageDisplayLocations: []
            },
            {
                node: circuit.nodes[vddNodeId],
                lines: [
                    new TectonicLine(...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M3"].getAnchorPointWithTransformations("Vdd")),
                    new TectonicLine(...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M4"].getAnchorPointWithTransformations("Vdd")),
                    new TectonicLine(...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M5"].getAnchorPointWithTransformations("Vdd")),
                    new TectonicLine(...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vs"), ...circuit.devices.mosfets["M6"].getAnchorPointWithTransformations("Vdd")),
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
    return circuit
}
export default useNmos9TransistorOpAmp
