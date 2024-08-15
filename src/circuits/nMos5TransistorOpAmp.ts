import { makeListOfSliders, makeMosfet, makeNode, makeVoltageSource } from '../functions/makeMosfet'
import { Circuit, Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { schematicOrigin, schematicScale } from '../constants'
import { Matrix } from 'ts-matrix'

const useNmos5TransistorOpAmp = () => {
    const circuit: Circuit = {
        transformationMatrix: new Matrix(3, 3, [[schematicScale, 0, schematicOrigin.x], [0, schematicScale, schematicOrigin.y], [0, 0, 1]]),
        textTransformationMatrix: new Matrix(3, 3), // to be updated immediately
        schematic: {
            vddLocations: [{x: -4, y: -12}, {x: 4, y: -12}],
            gndLocations: [{x: 0, y: 9}, {x: 4, y: 11}, {x: -8, y: 5}, {x: 8, y: 5}],
        },
        devices: {
            mosfets: {},
            voltageSources: {}
        },
        allSliders: [],
        nodes: {
            [gndNodeId]: makeNode(gndVoltage, true,
                [
                    {start: {x: 0, y: 8}, end: {x: 0, y: 9}},
                ]
            ),
            [vddNodeId]: makeNode(vddVoltage, true,
                [
                    {start: {x: -4, y: -11}, end: {x: -4, y: -12}},
                    {start: {x: 4, y: -11}, end: {x: 4, y: -12}},
                ]
            ),
            "M1_gate": makeNode(2, false,
                [
                    {start: {x: -8, y: 1}, end: {x: -8, y: 0}},
                    {start: {x: -8, y: 0}, end: {x: -6, y: 0}},
                ]

            ),
            "M1_drain": makeNode(4, false,
                [
                    {start: {x: -4, y: -2}, end: {x: -4, y: -7}},
                    {start: {x: -4, y: -6}, end: {x: -1, y: -6}},
                    {start: {x: -1, y: -6}, end: {x: -1, y: -9}},
                    {start: {x: -2, y: -9}, end: {x: 2, y: -9}},
                ]
            ),
            "M2_gate": makeNode(2, false,
                [
                    {start: {x: 8, y: 1}, end: {x: 8, y: 0}},
                    {start: {x: 8, y: 0}, end: {x: 6, y: 0}},
                ]

            ),
            "Vout": makeNode(4, false,
                [
                    {start: {x: 4, y: -2}, end: {x: 4, y: -7}},
                    {start: {x: 4, y: -5}, end: {x: 6, y: -5}},
                ],
                "Vout",
                [{x: 6.5, y: -5}]
            ),
            "Mb_gate": makeNode(0.7, false,
                [
                    {start: {x: 4, y: 7}, end: {x: 4, y: 6}},
                    {start: {x: 4, y: 6}, end: {x: 2, y: 6}},
                ]
            ),
            "Vnode": makeNode(1, false,
                [
                    {start: {x: -4, y: 2}, end: {x: -4, y: 3}},
                    {start: {x:  4, y: 2}, end: {x:  4, y: 3}},
                    {start: {x: -4, y: 3}, end: {x:  4, y: 3}},
                    {start: {x:  0, y: 3}, end: {x:  0, y: 4}},
                ],
                "V",
                [{x: -1, y: 2.5}]
            ),
        },
    }
    circuit.textTransformationMatrix = circuit.transformationMatrix.multiply(new Matrix(3, 3, [[1/schematicScale, 0, 0], [0, 1/schematicScale, 0], [0, 0, 1]]))
    circuit.devices.mosfets = {
        "Mb": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'nmos',
            0,
            6,
            circuit.nodes["Mb_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["Vnode"],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked
        ),
        "M1": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'nmos',
            -4,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes["M1_drain"],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
        ),
        "M2": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'nmos',
            4,
            0,
            circuit.nodes["M2_gate"],
            circuit.nodes["Vnode"],
            circuit.nodes["Vout"],
            circuit.nodes[gndNodeId],
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
        ),
        "M3": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'pmos',
            -4,
            -9,
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            undefined,
            undefined,
            false,
            Visibility.Locked,
            Visibility.Locked,
        ),
        "M4": makeMosfet(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            'pmos',
            4,
            -9,
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            circuit.nodes["Vout"],
            circuit.nodes[vddNodeId],
            undefined,
            undefined,
            true,
            Visibility.Locked,
            Visibility.Locked,
        ),
    }
    circuit.devices.voltageSources = {
        "V1": makeVoltageSource(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            {x: -8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_gate"],
            "V1",
            'gnd',
            true
        ),
        "V2": makeVoltageSource(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            {x: 8, y: 3},
            circuit.nodes[gndNodeId],
            circuit.nodes["M2_gate"],
            "V2",
            'gnd'
        ),
        "Vb": makeVoltageSource(
            circuit.textTransformationMatrix,
            circuit.transformationMatrix,
            {x: 4, y: 9},
            circuit.nodes[gndNodeId],
            circuit.nodes["Mb_gate"],
            "Vb",
            'gnd'
        ),
    }
    makeListOfSliders(circuit)
    return circuit
}
export default useNmos5TransistorOpAmp
