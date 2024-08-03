import { makeMosfet } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { ref } from 'vue'

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
            "GND": ref({voltage: 0, netCurrent: 0, capacitance: 100, fixed: true}),
            "M1_drain": ref({voltage: 5, netCurrent: 0, capacitance: 1, fixed: false}),
            "M1_gate": ref({voltage: 1, netCurrent: 0, capacitance: 1, fixed: false}),
        },
    }
    circuit.devices.mosfets = {"M1": makeMosfet(0, 0, circuit.nodes["M1_gate"], circuit.nodes["GND"], circuit.nodes["M1_drain"], circuit.nodes["GND"])}
    return circuit
}
export default useNmosSingle
