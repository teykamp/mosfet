import { makeMosfet } from '../functions/makeMosfet'
import { CircuitNode, Circuit, Mosfet } from '../types'
import { gndNode, vddNode } from './circuits'
import { ref } from 'vue'

const useNmosSingle = () => {
    const nodes = ref<{[nodeId: string] : CircuitNode}>({
        '0': gndNode,
        '1': vddNode,
        '2': {
            description: 'mosfet gate',
            solveOrder: 2,
            assumedVoltageUntilSolved: 0,
            solutionProcedure: null,
            voltage: 0
        }
    })

    const mosfets: Mosfet[] = [
        makeMosfet(100, 100)
    ]

    const nMosSingle: Circuit = {
        devices: mosfets,
        nodes: nodes
    }

    return {nMosSingle}
}
export default useNmosSingle
