import { makeMosfet } from '../functions/makeMosfet'
import { CircuitNode, Circuit, Mosfet } from '../types'
import { gndNode } from './circuits'
import { ref } from 'vue'
import { unit } from 'mathjs'

const useNmosCurrentMirror = () => {
    const nodes = ref<{[nodeId: string] : CircuitNode}>({
        '0': gndNode,
        '1': {
            description: 'mosfet gate/drain connection',
            solveOrder: 1,
            assumedVoltageUntilSolved: 5,
            solutionProcedure: null,
            voltage: unit(1, 'V')
        },
        '2': {
            description: 'mirror drain',
            solveOrder: 2,
            assumedVoltageUntilSolved: 0,
            solutionProcedure: null,
            voltage: unit(0, 'V')
        }
    })

    const mosfets: Mosfet[] = {
        'M1': makeMosfet(100, 100)
    }

    const nMosCurrentMirror: Circuit = {
        devices: mosfets,
        nodes: nodes
    }

    return {nMosCurrentMirror}
}
export default useNmosCurrentMirror
