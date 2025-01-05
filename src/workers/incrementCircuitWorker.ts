import { circuits, DefinedCircuits } from "../circuits/circuits"
import { Circuit, CircuitCopy } from "../classes/circuit"
import { incrementCircuit } from "../functions/incrementCircuit"

const circuitCopies: {[key: string]: Circuit} = Object.fromEntries(Object.entries(circuits).map(([key, myCircuit]: [string, Circuit]): [string, CircuitCopy] => {return [key, myCircuit.copy()!]}))
let currentCircuitName: DefinedCircuits = "nMosDiffPair"
let circuit = circuitCopies[currentCircuitName]
let lastIncrementTimestamp = 0
let isPlaying = true
let deltaT = 50; 

onmessage = function (event: MessageEvent<string>) {
    const message = JSON.parse(event.data);
    if (message.action === "setPlayingState") {
        togglePlayState(message.isPlaying); // updating play/stop state
        //console.log(message.isPlaying)
    } else if (message.action === "updateSpeed"){
        //console.log("Speed updated to", message.speed)
        updateDeltaT(message.speed);
    }
    else {
        const json: [DefinedCircuits, {[key: string]: number}] = JSON.parse(event.data)
        if (json[0] != currentCircuitName) {
            circuit = circuitCopies[json[0]]
            currentCircuitName = json[0]
        }

        circuit.nodeVoltagesFromJson(event.data)

        postMessage(circuit.nodeVoltagesToJson())
    }
}

const updateDeltaT = (speed: number) => {
    if(speed == 0.5){
        deltaT = 200;
    } else if(speed == 0.75){
        deltaT = 100;
    } else if(speed == 1){
        deltaT = 50;
    } else if(speed == 2){
        deltaT = 25;
    } 
    //console.log("deltaT updated to", deltaT)
};

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
