// import { Visibility } from '../types'
import { gndNodeId, vddNodeId, gndVoltage, vddVoltage } from '../constants'
import { Circuit } from '../classes/circuit'
import { Node } from '../classes/node'
import { Ref, ref } from 'vue'
// import { ParasiticCapacitor } from '../classes/parasiticCapacitor'
import { Schematic } from '../classes/schematic'
import { Mosfet } from '../classes/mosfet'
import { VoltageSource } from '../classes/voltageSource'
import { foldl } from '../functions/extraMath'
import { TransformationMatrix } from '../classes/transformationMatrix'

const usePmosSingle = () => {
    const circuit: Circuit = new Circuit({x: 0, y: 3}, 10, 20)

    //////////////////////////////
    ///          NODES         ///
    //////////////////////////////

    circuit.nodes = {
        [gndNodeId]: ref(new Node(gndVoltage, true)),
        [vddNodeId]: ref(new Node(vddVoltage, true)),
        "M1_drain": ref(new Node(5, false,
            [
                {start: {x: 0, y: 2}, end: {x: 0, y: 4}}
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
            'pmos',
            0,
            0,
            circuit.nodes["M1_gate"],
            circuit.nodes[vddNodeId],
            circuit.nodes["M1_drain"],
            circuit.nodes[vddNodeId]
        )
    }

    //////////////////////////////
    ///     VOLTAGE SOURCES    ///
    //////////////////////////////

    circuit.devices.voltageSources = {
        "Vd": new VoltageSource(
            circuit.transformations,
            {x: 0, y: 6},
            circuit.nodes[gndNodeId],
            circuit.nodes["M1_drain"],
            "Vd",
            'gnd',
            true
        ),
    }

    //////////////////////////////
    ///        SCHEMATIC       ///
    //////////////////////////////

    circuit.schematic = new Schematic(
        circuit.transformations,
        [{x: 0, y: 8}],
        [circuit.devices.mosfets["M1"].getAnchorPoint("Vg")],
        // [{x: 0, y: -2}],
        [],
        Object.values(circuit.devices.mosfets),
        Object.values(circuit.nodes)
    )

    //////////////////////////////
    ///        FUNCTIONS       ///
    //////////////////////////////

    circuit.updateDevicePositions = (_circuit: Circuit) => {
        _circuit.devices.mosfets["M1"].moveTo(_circuit.devices.mosfets["M1"].transformationMatrix.inverse().multiply(_circuit.transformationMatrix).transformPoint({x: 0, y: _circuit.devices.mosfets["M1"].Vd.value.voltage * -1}))
        _circuit.devices.mosfets["M1"]._transformationMatrix = ref(foldl<Ref<TransformationMatrix>, TransformationMatrix>((x, result) => result.multiply(x.value), new TransformationMatrix(),  _circuit.devices.mosfets["M1"].transformations)) as Ref<TransformationMatrix>
    }

    return circuit
}
export default usePmosSingle
