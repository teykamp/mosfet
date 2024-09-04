// import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { ref } from 'vue'
// import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'

const useNmosSingle = () => {
    const circuit: Circuit = new Circuit({x: 0, y: -3}, 10, 20)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_drain": ref(new Node(5, false,
            [
                {start: {x: 0, y: -2}, end: {x: 0, y: -4}},
            ]
        )),
        "M1_gate": ref(new Node(1, false)),

    }

    //////////////////////////////
    ///         MOSFETS        ///
    //////////////////////////////

    circuit.devices.mosfets = {
        "M1": new Mosfet(
            circuit.transformations,
            'nmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[gndNodeId]
        )
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "Vd": new VoltageSource(
            circuit.transformations,
            {x: 0, y: -6},
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId],
            "Vdd-Vd",
            'vdd',
            true
        ),
    }

    //////////////////////////////
    ///        SCHEMATIC       ///
    //////////////////////////////

    circuit.schematic = new Schematic(
        circuit.transformations,
        [{x: 0, y: 2}],
        [{x: 0, y: -8}],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes)
    )

    return circuit
}
export default useNmosSingle
