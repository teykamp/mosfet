import { makeListOfSliders, makeMosfet, makeNode } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { vddNodeId, vddVoltage } from '../constants'

const useNmosSingle = () => {
    const circuit: Circuit = {
        schematic: {
            // wires: [],
            vddLocations: [{x: 0, y: -2}],
            gndLocations: [],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        nodes: {
            [vddNodeId]: makeNode(vddVoltage, true),
            "M1_drain": makeNode(5, false),
            "M1_gate": makeNode(1, false),
        },
        allSliders: []
    }
    circuit.devices.mosfets = {
        "M1": makeMosfet(
            'pmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId]
        )
    }
    makeListOfSliders(circuit)
    return circuit
}
export default useNmosSingle
