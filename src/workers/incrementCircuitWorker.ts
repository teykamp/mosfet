import { circuits, DefinedCircuits } from "../circuits/circuits"
import { Circuit, CircuitCopy } from "../classes/circuit"
import { incrementCircuit } from "../functions/incrementCircuit"

const circuitCopies: {[key: string]: Circuit} = Object.fromEntries(Object.entries(circuits).map(([key, myCircuit]: [string, Circuit]): [string, CircuitCopy] => {return [key, myCircuit.copy()!]}))
let currentCircuitName: DefinedCircuits = "nMosDiffPair"
let circuit = circuitCopies[currentCircuitName]
let lastIncrementTimestamp = 0
let isPlaying = true

onmessage = function (event: MessageEvent<string>) {
    const message = JSON.parse(event.data);
    if (message.action === "setPlayingState") {
        togglePlayState(message.isPlaying); // updating play/stop state
        console.log(message.isPlaying)
    } else {
        const json: [DefinedCircuits, {[key: string]: number}] = JSON.parse(event.data)
        if (json[0] != currentCircuitName) {
            circuit = circuitCopies[json[0]]
            currentCircuitName = json[0]
        }

        circuit.nodeVoltagesFromJson(event.data)

        postMessage(circuit.nodeVoltagesToJson())
    }
}


const deltaT = 20 // ms
const repeatIncrementCircuit = () => {
    // if state is playing, incrementCircuit is called as normal
    if (isPlaying) {incrementCircuit(circuit, deltaT)}
    printTimeElapsed()
    setTimeout(repeatIncrementCircuit, deltaT)
}

const printTimeElapsed = () => {
    const timestamp = Date.now();
    // console.log("Elapsed time = ", (timestamp - lastIncrementTimestamp).toFixed(0))
    lastIncrementTimestamp = timestamp
}

const togglePlayState = (state: boolean) => {
    isPlaying = state;
};

repeatIncrementCircuit()
