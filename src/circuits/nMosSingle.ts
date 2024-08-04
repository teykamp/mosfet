import { makeMosfet } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { ref } from 'vue'
import { gndNodeId } from '../constants'

const useNmosSingle = () => {
    const circuit: Circuit = {
        schematic: {
            lines: [],
            vddLocations: [],
            gndLocations: [{x: 0, y: 2}],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        nodes: {
            gndNodeId: ref({voltage: 0, netCurrent: 0, capacitance: 100, fixed: true}),
            "M1_drain": ref({voltage: 5, netCurrent: 0, capacitance: 1, fixed: false}),
            "M1_gate": ref({voltage: 1, netCurrent: 0, capacitance: 1, fixed: false}),
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
