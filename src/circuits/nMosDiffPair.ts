import { makeMosfet, makeNode, makeVoltageSource } from '../functions/makeMosfet'
import { Circuit } from '../types'
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
            vddLocations: [],
            gndLocations: [{x: 0, y: 2}],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        nodes: {
            [gndNodeId]: makeNode(gndVoltage, true),
            [vddNodeId]: makeNode(vddVoltage, true),
            "M1_gate": makeNode(2, false),
            // "M1_drain": makeNode(5, false),
            "M2_gate": makeNode(2, false),
            // "M2_drain": makeNode(5, false),
            "Mb_gate": makeNode(0.7, false),
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
            circuit.nodes[gndNodeId]
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
            true
        ),
        "M2": makeMosfet(
            4,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId]
        ),
    }
    circuit.devices.voltageSources = {
        "V1": makeVoltageSource(
            {x: -5, y: 6},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1"
        ),
        "V2": makeVoltageSource(
            {x: 5, y: 6},
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V1"
        ),
        "Vb": makeVoltageSource(
            {x: 0, y: 0},
            circuit.nodes[gndNodeId],
            circuit.nodes["Mb_gate"],
            "V1"
        ),

    }
    return circuit
}
export default useNmosDiffPair
