import { makeListOfSliders, makeMosfet, makeNode } from '../functions/makeMosfet'
import { Circuit } from '../types'
import { gndNodeId, gndVoltage } from '../constants'
import { schematicOrigin, schematicScale } from '../constants'
import { Matrix } from 'ts-matrix'

const useNmosSingle = () => {
    const circuit: Circuit = {
        transformationMatrix: new Matrix(3, 3, [[schematicScale, 0, schematicOrigin.x], [0, schematicScale, schematicOrigin.y], [0, 0, 1]]),
        textTransformationMatrix: new Matrix(3, 3), // to be updated immediately
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
        allSliders: []
    }
    circuit.textTransformationMatrix = circuit.transformationMatrix.multiply(new Matrix(3, 3, [[1/schematicScale, 0, 0], [0, 1/schematicScale, 0], [0, 0, 1]]))
    circuit.devices.mosfets = {
        "M1": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'nmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[gndNodeId]
        )
    }
    makeListOfSliders(circuit)
    return circuit
}
export default useNmosSingle
