import { circuits, DefinedCircuits } from "../circuits/circuits"
import { Circuit, CircuitCopy } from "../classes/circuit"
import { incrementCircuit } from "../functions/incrementCircuit"
import { includeEarlyEffect } from "../globalState"
import { incrementCircuitWorkerMessage } from "../types"

const circuitCopies: {[key: string]: Circuit} = Object.fromEntries(Object.entries(circuits).map(([key, myCircuit]: [string, Circuit]): [string, CircuitCopy] => {return [key, myCircuit.copy()!]}))
let currentCircuitName: DefinedCircuits = "nMosDiffPair"
let circuit = circuitCopies[currentCircuitName]
let lastIncrementTimestamp = 0

onmessage = function (event: MessageEvent<string>) {
    const json: incrementCircuitWorkerMessage = JSON.parse(event.data)
    if (json[0] != currentCircuitName) {
        circuit = circuitCopies[json[0]]
        currentCircuitName = json[0]
    }
    includeEarlyEffect.value = json[2]["earlyEffect"]

    circuit.nodeVoltagesFromJson(event.data)

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
