import { circuits, DefinedCircuits } from "../circuits/circuits"
import { Circuit, CircuitCopy } from "../classes/circuit"
import { incrementCircuit } from "../functions/incrementCircuit"

const circuitCopies: {[key: string]: Circuit} = Object.fromEntries(Object.entries(circuits).map(([key, myCircuit]: [string, Circuit]): [string, CircuitCopy] => {return [key, myCircuit.copy()!]}))

let currentCircuitName: DefinedCircuits = "nMosDiffPair"
let circuit = circuitCopies[currentCircuitName]
let incrementCircuitRunning = false
let lastIncrementTimestamp = 0

onmessage = function (event: MessageEvent<string>) {
    const json: [DefinedCircuits, {[key: string]: number}] = JSON.parse(event.data)
    if (json[0] != currentCircuitName) {
        circuit = circuitCopies[json[0]]
    }

    if (circuit.nodeVoltagesFromJson(event.data)) {
        // reset node capacitances
        for (const nodeId in circuit.nodes) {
            const node = circuit.nodes[nodeId].value
            node.capacitance = node.originalCapacitance
        }
    }

    postMessage(circuit.nodeVoltagesToJson())
}

const deltaT = 20 // ms
const repeatIncrementCircuit = () => {
    incrementCircuit(circuit, deltaT)
    printTimeElapsed()
    setTimeout(repeatIncrementCircuit, deltaT)
}

const printTimeElapsed = () => {
    const timestamp = Date.now();
    // console.log("Elapsed time = ", (timestamp - lastIncrementTimestamp).toFixed(0))
    lastIncrementTimestamp = timestamp
}

repeatIncrementCircuit()
