import { Circuit, CircuitNode } from "../types"
import nMosSingle from "./nMosSingle"
import { unit } from 'mathjs'

export const gndNode: CircuitNode = {
    description: 'GND. Always holds the value 0V and is first in solve order.',
    solveOrder: 0,
    assumedVoltageUntilSolved: 0,
    solutionProcedure: () => 0,
    voltage: unit(0, 'V')
}

export const vddNode: CircuitNode = {
    description: 'VDD. Always holds the value 5V and is second in solve order, after GND.',
    solveOrder: 1,
    assumedVoltageUntilSolved: 5,
    solutionProcedure: () => 5,
    voltage: unit(5, 'V')
}

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle().nMosSingle,
    'nMosCurrentMirror': nMosSingle().nMosSingle,
    'nMosDiffPair': nMosSingle().nMosSingle,
}
