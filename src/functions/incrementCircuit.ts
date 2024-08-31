import { type Ref } from "vue"
import { Circuit } from "../classes/circuit"
import { Node } from "../classes/node"
import { gndNodeId, gndVoltage, vddNodeId, vddVoltage } from "../constants"

export const incrementCircuit = (circuit: Circuit, deltaT: number = 10) => {
    // first, set all the currents in the circuit to zero
    for (let nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId]
        node.value.netCurrent = 0 // Amps
    }

    // find the net current flowing into or out of each node by counting the current through each mosfet
    for (let mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]

        // get the current flowing through the mosfet
        const mosfetCurrent = mosfet.getMosfetCurrent()

        if(mosfet.mosfetType == 'nmos') {
            mosfet.Vd.value.netCurrent -= mosfetCurrent
            mosfet.Vs.value.netCurrent += mosfetCurrent
        }
        else if(mosfet.mosfetType == 'pmos') {
            mosfet.Vd.value.netCurrent += mosfetCurrent
            mosfet.Vs.value.netCurrent -= mosfetCurrent
        }
    }

    // add voltage source current to ensure the total current is equal to zero
    for (let voltageSourceId in circuit.devices.voltageSources) {
        const voltageSource = circuit.devices.voltageSources[voltageSourceId]
        // assuming the negative side is tied to GND
        if (voltageSource.fixedAt == 'gnd') {
            voltageSource.current = voltageSource.vplus.value.netCurrent
            voltageSource.vminus.value.netCurrent += voltageSource.current
            voltageSource.vplus.value.netCurrent = 0
        }
        // assuming the positive side is tied to VDD
        else if (voltageSource.fixedAt == 'vdd') {
            voltageSource.current = -voltageSource.vminus.value.netCurrent
            voltageSource.vplus.value.netCurrent += voltageSource.current
            voltageSource.vminus.value.netCurrent = 0
        }
        else {
            console.log("Cannot solve voltage source not attached to GND or VDD")
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

        checkNodeBounceAndAdjustCapacitance(node)

        let deltaV = node.value.netCurrent / node.value.capacitance * (deltaT / 1000) * 0.5
        // place an upper and lower bound on how quickly the voltage is allowed to change, since the net current may vary on several orders of magnitude
        if (deltaV > 0.1) {
            deltaV = 0.1
        }
        else if (deltaV < -0.1) {
            deltaV = -0.1
        }
        node.value.voltage += deltaV
        // add the new value to the historical voltages queue
        node.value.historicVoltages.dequeue()
        node.value.historicVoltages.enqueue(node.value.voltage)
    }
}

const checkNodeBounceAndAdjustCapacitance = (node: Ref<Node>) => {
    let direcitonSwitches = 0
    let previousVoltage = 0
    let previousIncreasing = true
    node.value.historicVoltages.toArray().forEach((voltage, idx) => {
        const increasing = (voltage - previousVoltage > 0)
        if ((voltage - previousVoltage == 0)) {
            // continue -- this keyword doesn't work because it's not an actual for loop, so we use if else
        } else {
            // check if we were increasing and then switched directions
            if (increasing !== previousIncreasing) {
                direcitonSwitches += 1
            }
        }
        previousIncreasing = increasing
        previousVoltage = voltage
        if (idx <= 1) {
            direcitonSwitches = 0 // ignore the first result before assigning previousIncreasing and previousVoltage
        }
    })
    if (direcitonSwitches >= 2) {
        node.value.capacitance += node.value.originalCapacitance // * 10 // double the capacitance on the node
    }
    // if (direcitonSwitches < 1) {
    //     node.value.capacitance -= node.value.originalCapacitance * 10 // decrease the capacitance
    // }
    // node.value.capacitance = node.value.originalCapacitance * (1 + 10 * direcitonSwitches)

    // never let the capacitance get less than it was originally
    if (node.value.capacitance < node.value.originalCapacitance) {
        node.value.capacitance = node.value.originalCapacitance
    }
}
