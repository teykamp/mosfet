import { circuits } from "../circuits/circuits"
import { incrementCircuit } from "../functions/incrementCircuit"

let circuit = circuits["nMosDiffPair"].copy()!
let incrementCircuitRunning = false
let lastIncrementTimestamp = 0

onmessage = function (event: MessageEvent<string>) {
    circuit.nodeVoltagesFromJson(event.data)
    if (!incrementCircuitRunning) { // the first time the message is called
        repeatIncrementCircuit()
        incrementCircuitRunning = true
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
    console.log("Elapsed time = ", (timestamp - lastIncrementTimestamp).toFixed(0))
    lastIncrementTimestamp = timestamp
}
