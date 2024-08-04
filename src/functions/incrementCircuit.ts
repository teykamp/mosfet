import { Circuit } from "../types"
import { getMosfetCurrent } from "../functions/makeMosfet"
import { gndNodeId, gndVoltage, vddNodeId, vddVoltage } from "../constants"

export const incrementCircuit = (circuit: Circuit, deltaT: number = 0.01) => {
    // first, set all the currents in the circuit to zero
    for (let nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId]
        node.value.netCurrent = 0 // Amps
    }

    // find the net current flowing into or out of each node by counting the current through each mosfet
    for (let mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]

        // get the current flowing through the mosfet
        const mosfetCurrent = getMosfetCurrent(mosfet)

        if(mosfet.mosfetType == 'nmos') {
            mosfet.Vd.value.netCurrent -= mosfetCurrent
            mosfet.Vs.value.netCurrent += mosfetCurrent
        }
        else if(mosfet.mosfetType == 'pmos') {
            mosfet.Vd.value.netCurrent += mosfetCurrent
            mosfet.Vs.value.netCurrent -= mosfetCurrent
        }
    }

    // adjust the voltage at each node based on I = C * dV/dt
    for (let nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId]
        // skip the node if it is VDD, GND, or being dragged
        if (nodeId == gndNodeId) {
            node.value.voltage = gndVoltage
            continue
        }
        if (nodeId == vddNodeId) {
            node.value.voltage = vddVoltage
            continue
        }
        if (node.value.fixed) {
            continue
        }

        let deltaV = node.value.netCurrent / node.value.capacitance * deltaT
        // place an upper and lower bound on how quickly the voltage is allowed to change, since the net current may vary on several orders of magnitude
        if (deltaV > 0.1) {
            deltaV = 0.1
        }
        else if (deltaV < -0.1) {
            deltaV = -0.1
        }
        node.value.voltage += deltaV
    }
}
