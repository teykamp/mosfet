import { makeMosfet, makeNode } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'

const useNmosDiffPair = () => {
    const circuit: Circuit = {
        schematic: {
            lines: [

            ],
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
            "Vnode": makeNode(1, false),
        },
    }
    circuit.devices.mosfets = {
        "Mb": makeMosfet(
            0,
            5,
            circuit.nodes["Mb_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["Vnode"],
            circuit.nodes[gndNodeId]
        ),
        "M1": makeMosfet(
            -2,
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
            2,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes[vddNodeId],
            circuit.nodes[gndNodeId]
        ),
    }
    return circuit
}
export default useNmosDiffPair
