import { makeMosfet } from '../functions/makeMosfet'
import { CircuitNode, Circuit, Mosfet } from '../types'
import { gndNode, vddNode } from './circuits'
import { getMosfetCurrent } from '../functions/makeMosfet'
import { ref } from 'vue'
import { unit } from 'mathjs'

var fzero = require("fzero");

fzero()

const useNmosSingle = () => {
    const nodes = ref<{[nodeId: string] : CircuitNode}>({
        '0': gndNode,
        '1': vddNode,
        '2': {
            description: 'Mb gate',
            solveOrder: 2,
            assumedVoltageUntilSolved: 2.5,
            solutionProcedure: null,
            voltage: unit(2.5, 'V')
        },
        '3': {
            description: 'M1 gate',
            solveOrder: 3,
            assumedVoltageUntilSolved: 2.5,
            solutionProcedure: null,
            voltage: unit(2.5, 'V')
        },
        '4': {
            description: 'M2 gate',
            solveOrder: 4,
            assumedVoltageUntilSolved: 2.5,
            solutionProcedure: null,
            voltage: unit(2.5, 'V')
        },
        '5': {
            description: 'Common-source node',
            solveOrder: 5,
            assumedVoltageUntilSolved: 1,
            solutionProcedure: (circuit: Circuit) => {
            const Ib: number = getMosfetCurrent(circuit.devices['Mb']).toNumber('A')
                return 5
            },
            voltage: unit(2.5, 'V')
        }
    })

    const mosfets: {[name: string]: Mosfet} = {
        //                         Vg,         Vs,         Vd
        'Mb': makeMosfet(250, 400, nodes.value['2'].voltage, nodes.value['0'].voltage, nodes.value['5'].voltage),
        'M1': makeMosfet(100, 100, nodes.value['3'].voltage, nodes.value['5'].voltage, nodes.value['1'].voltage),
        'M2': makeMosfet(400, 100, nodes.value['4'].voltage, nodes.value['5'].voltage, nodes.value['1'].voltage),
    }

    const nMosSingle: Circuit = {
        devices: mosfets,
        nodes: nodes
    }

    return {nMosSingle}
}
export default useNmosSingle
