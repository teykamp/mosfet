import { makeMosfet } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { ref } from 'vue'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage, defaultNodeCapacitance, powerSupplyCapacitance } from '../constants'

const useNmosDiffPair = () => {
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
            [gndNodeId]: ref({voltage: gndVoltage, netCurrent: 0, capacitance: powerSupplyCapacitance, fixed: true}),
            [vddNodeId]: ref({voltage: vddVoltage, netCurrent: 0, capacitance: powerSupplyCapacitance, fixed: true}),
            "M1_gate": ref({voltage: 2, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
            "M1_drain": ref({voltage: 5, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
            "M2_gate": ref({voltage: 2, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
            "M2_drain": ref({voltage: 5, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
            "Mb_gate": ref({voltage: 0.7, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
            "Vnode": ref({voltage: 1, netCurrent: 0, capacitance: defaultNodeCapacitance, fixed: false}),
        },
    }
    console.log(circuit.nodes[gndNodeId])
    console.log(circuit.nodes["M1_gate"])
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
            circuit.nodes[gndNodeId]
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
