import { makeMosfet, makeNode } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { gndNodeId, gndVoltage } from '../constants'

const useNmosSingle = () => {
    const circuit: Circuit = {
        schematic: {
            // wires: [],
            vddLocations: [],
            gndLocations: [{x: 0, y: 2}],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        nodes: {
            [gndNodeId]: makeNode(gndVoltage, true),
            "M1_drain": makeNode(5, false),
            "M1_gate": makeNode(1, false),
        },
    }
    circuit.devices.mosfets = {
        "M1": makeMosfet(
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[gndNodeId]
        )
    }
    return circuit
}
export default useNmosSingle
