import { makeListOfSliders, makeMosfet, makeNode } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { vddNodeId, vddVoltage } from '../constants'
import { schematicOrigin, schematicScale } from '../constants'
import { Matrix } from 'ts-matrix'

const usePmosSingle = () => {
    const circuit: Circuit = {
        transformationMatrix: new Matrix(3, 3, [[schematicScale, 0, schematicOrigin.x], [0, schematicScale, schematicOrigin.y], [0, 0, 1]]),
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
            circuit.transformationMatrix,
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
export default usePmosSingle
