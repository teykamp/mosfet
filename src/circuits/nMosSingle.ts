import { makeMosfet } from '../functions/makeMosfet'
import { Circuit, Node } from '../types'
import { ref, type Ref } from 'vue'

const useNmosSingle = () => {
    const nodes: {[nodeId: string]: Ref<Node>} = {
        "GND": ref({voltage: 0, netCurrent: 0, capacitance: 100, fixed: true}),
        "M1_drain": ref({voltage: 5, netCurrent: 0, capacitance: 1, fixed: false}),
        "M1_gate": ref({voltage: 1, netCurrent: 0, capacitance: 1, fixed: false}),
    }

    const circuit: Circuit = {
        schematic: {
            lines: [],
            vddLocations: [],
            gndLocations: [{x: 0, y: 2}],
        },
        devices: {
            mosfets: {"M1": makeMosfet(0, 0, nodes["M1_gate"], nodes["GND"], nodes["M1_drain"], nodes["GND"])},
            voltageSources: {}
        },
        nodes: nodes,
    }
    return circuit
}
export default useNmosSingle
