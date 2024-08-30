import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { schematicOrigin, schematicScale } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { ref } from 'vue'
import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'

const useNmos5TransistorOpAmp = (): Circuit => {
    const circuit: Circuit = new Circuit(schematicOrigin, schematicScale * 0.75)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true,
            [
                {start: {x: 0, y: 8}, end: {x: 0, y: 9}},
            ]
        )),
        [vddNodeId]: ref(new Node(vddVoltage, true,
            [
                {start: {x: -4, y: -11}, end: {x: -4, y: -12}},
                {start: {x: 4, y: -11}, end: {x: 4, y: -12}},
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
                {start: {x: -4, y: -2}, end: {x: -4, y: -7}},
                {start: {x: -4, y: -6}, end: {x: -1, y: -6}},
                {start: {x: -1, y: -6}, end: {x: -1, y: -9}},
                {start: {x: -2, y: -9}, end: {x: 2, y: -9}},
            ]
        )),
        "M2_gate": ref(new Node(2, false,
            [
                {start: {x: 8, y: 1}, end: {x: 8, y: 0}},
                {start: {x: 8, y: 0}, end: {x: 6, y: 0}},
            ]

        )),
        "Vout": ref(new Node(4, false,
            [
                {start: {x: 4, y: -2}, end: {x: 4, y: -7}},
                {start: {x: 4, y: -5}, end: {x: 6, y: -5}},
            ],
            "Vout",
            [{x: 6.5, y: -5}]
        )),
        "Mb_gate": ref(new Node(0.7, false,
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
            circuit.transformationMatrix,
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
            circuit.transformationMatrix,
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
            circuit.transformationMatrix,
            'nmos',
            4,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes["Vout"],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
        ),
        "M3": new Mosfet(
            circuit.transformationMatrix,
            'pmos',
            -4,
            -9,
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
            circuit.transformationMatrix,
            'pmos',
            4,
            -9,
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
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "V1": new VoltageSource(
            circuit.transformationMatrix,
            {x: -8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": new VoltageSource(
            circuit.transformationMatrix,
            {x: 8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V2",
            'gnd'
        ),
        "Vb": new VoltageSource(
            circuit.transformationMatrix,
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
        circuit.transformationMatrix,
        [{x: 0, y: 9}, {x: 4, y: 11}, {x: -8, y: 5}, {x: 8, y: 5}],
        [{x: -4, y: -12}, {x: 4, y: -12}],
        [new ParasiticCapacitor(
            circuit.transformationMatrix,
            circuit.nodes["Vout"],
            {x: 6, y: -4},
            [
                {start: {x: 6, y: -5}, end: {x: 6, y: -4}},
            ],
        )],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes)
    )

    return circuit
}
export default useNmos5TransistorOpAmp
