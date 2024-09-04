import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { ref } from 'vue'
// import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'


const useNmos9TransistorOpAmp = () => {
    const circuit: Circuit = new Circuit({x: 10, y: -2}, 50, 30)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true,
            [
                {start: {x: 0, y: 8}, end: {x: 0, y: 9}},
                {start: {x: 24, y: 8}, end: {x: 24, y: 9}},
                {start: {x: 16, y: 8}, end: {x: 16, y: 9}},
            ]
        )),
        [vddNodeId]: ref(new Node(vddVoltage, true,
            [
                {start: {x: -4, y: -14}, end: {x: -4, y: -15}},
                {start: {x: 4, y: -9}, end: {x: 4, y: -10}},
                {start: {x: 16, y: -9}, end: {x: 16, y: -10}},
                {start: {x: 24, y: -14}, end: {x: 24, y: -15}},
            ]
        )),
        "M1_gate": ref(new Node(2, false,
            [
                {start: {x: -8, y: 1}, end: {x: -8, y: 0}},
                {start: {x: -8, y: 0}, end: {x: -6, y: 0}},
            ]

        )),
        "M1_drain": ref(new Node(4, false,
            [
                {start: {x: -4, y: -2}, end: {x: -4, y: -10}},
                {start: {x: -4, y: -9}, end: {x: -1, y: -9}},
                {start: {x: -1, y: -9}, end: {x: -1, y: -12}},
                {start: {x: -2, y: -12}, end: {x: 22, y: -12}},
            ]
        )),
        "M2_gate": ref(new Node(2, false,
            [
                {start: {x: 8, y: 1}, end: {x: 8, y: 0}},
                {start: {x: 8, y: 0}, end: {x: 6, y: 0}},
            ]

        )),
        "M2_drain": ref(new Node(4, false,
            [
                {start: {x: 4, y: -2}, end: {x: 4, y: -5}},
                {start: {x: 4, y: -4}, end: {x: 7, y: -4}},
                {start: {x: 7, y: -4}, end: {x: 7, y: -7}},
                {start: {x: 6, y: -7}, end: {x: 14, y: -7}},
            ]
        )),
        "M7_drain": ref(new Node(1, false,
            [
                {start: {x: 16, y: -5}, end: {x: 16, y: 4}},
                {start: {x: 16, y: 3}, end: {x: 19, y: 3}},
                {start: {x: 19, y: 3}, end: {x: 19, y: 6}},
                {start: {x: 18, y: 6}, end: {x: 22, y: 6}},
            ]
        )),
        "Vout": ref(new Node(2.5, false,
            [
                {start: {x: 24, y: 4}, end: {x: 24, y: -10}},
                {start: {x: 24, y: -3}, end: {x: 26, y: -3}},
            ],
            "Vout",
            [{x: 26.5, y: -3}]
        )),
        "Mb_gate": ref(new Node(1.1, false,
            [
                {start: {x: 4, y: 7}, end: {x: 4, y: 6}},
                {start: {x: 4, y: 6}, end: {x: 2, y: 6}},
            ]
        )),
        "Vnode": ref(new Node(1, false,
            [
                {start: {x: -4, y: 2}, end: {x: -4, y: 3}},
                {start: {x:  4, y: 2}, end: {x:  4, y: 3}},
                {start: {x: -4, y: 3}, end: {x:  4, y: 3}},
                {start: {x:  0, y: 3}, end: {x:  0, y: 4}},
            ],
            "V",
            [{x: -1, y: 2.5}]
        )),
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
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
            circuit.transformations,
            {x: -8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": new VoltageSource(
            circuit.transformations,
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
        [{x: 0, y: 9}, {x: 4, y: 11}, {x: -8, y: 5}, {x: 8, y: 5}, {x: 24, y: 9}, {x: 16, y: 9}],
        [{x: -4, y: -15}, {x: 4, y: -10}, {x: 16, y: -10}, {x: 24, y: -15}],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes)
    )
    return circuit
}
export default useNmos9TransistorOpAmp
