import { makeListOfSliders, makeMosfet, makeNode, makeVoltageSource } from '../functions/makeMosfet'
import { Circuit, Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'

const useNmosDiffPair = () => {
    const circuit: Circuit = {
        schematic: {
            // wires: [
            //     {
            //         endPoints: {
            //             "Mb_drain":  {x:  0, y: 3},
            //             "M1_source": {x: -4, y: 2},
            //             "M2_source": {x:  4, y: 2},
            //         },
            //     },
            // ],
            vddLocations: [{x: -4, y: -3}, {x: 4, y: -3}],
            gndLocations: [{x: 0, y: 9}, {x: 4, y: 11}, {x: -8, y: 5}, {x: 8, y: 5}],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        allSliders: [],
        nodes: {
            [gndNodeId]: makeNode(gndVoltage, true,
                [
                    {start: {x: 0, y: 8}, end: {x: 0, y: 9}},
                ]
            ),
            [vddNodeId]: makeNode(vddVoltage, true,
                [
                    {start: {x: -4, y: -2}, end: {x: -4, y: -3}},
                    {start: {x: 4, y: -2}, end: {x: 4, y: -3}},
                ]
            ),
            "M1_gate": makeNode(2, false,
                [
                    {start: {x: -8, y: 1}, end: {x: -8, y: 0}},
                    {start: {x: -8, y: 0}, end: {x: -6, y: 0}},
                ]

            ),
            // "M1_drain": makeNode(5, false),
            "M2_gate": makeNode(2, false,
                [
                    {start: {x: 8, y: 1}, end: {x: 8, y: 0}},
                    {start: {x: 8, y: 0}, end: {x: 6, y: 0}},
                ]

            ),
            // "M2_drain": makeNode(5, false),
            "Mb_gate": makeNode(0.7, false,
                [
                    {start: {x: 4, y: 7}, end: {x: 4, y: 6}},
                    {start: {x: 4, y: 6}, end: {x: 2, y: 6}},
                ]
            ),
            "Vnode": makeNode(1, false,
                [
                    {start: {x: -4, y: 2}, end: {x: -4, y: 3}},
                    {start: {x:  4, y: 2}, end: {x:  4, y: 3}},
                    {start: {x: -4, y: 3}, end: {x:  4, y: 3}},
                    {start: {x:  0, y: 3}, end: {x:  0, y: 4}},
                ]
            ),
        },
    }
    circuit.devices.mosfets = {
        "Mb": makeMosfet(
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
        "M1": makeMosfet(
            -4,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
        ),
        "M2": makeMosfet(
            4,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
        ),
    }
    circuit.devices.voltageSources = {
        "V1": makeVoltageSource(
            {x: -8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": makeVoltageSource(
            {x: 8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V2",
            'gnd'
        ),
        "Vb": makeVoltageSource(
            {x: 4, y: 9},
            circuit.nodes[gndNodeId],
            circuit.nodes["Mb_gate"],
            "Vb",
            'gnd'
        ),
    }
    makeListOfSliders(circuit)
    return circuit
}
export default useNmosDiffPair
