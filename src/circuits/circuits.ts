import { Circuit, CircuitNode } from "../types"
import nMosSingle from "./nMosSingle"

export const gndNode: CircuitNode = {
    description: 'GND. Always holds the value 0V and is first in solve order.',
    solveOrder: 0,
    assumedVoltageUntilSolved: 0,
    solutionProcedure: () => 0,
    voltage: 0
}

export const vddNode: CircuitNode = {
    description: 'VDD. Always holds the value 5V and is second in solve order, after GND.',
    solveOrder: 1,
    assumedVoltageUntilSolved: 5,
    solutionProcedure: () => 5,
    voltage: 5
}

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle().nMosSingle,
    'nMosCurrentMirror': nMosSingle().nMosSingle,
    'nMosDiffPair': nMosSingle().nMosSingle,
}
