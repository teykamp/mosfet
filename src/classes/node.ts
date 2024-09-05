import { SchematicEffect } from "../types"
import { Queue } from "./queue"
import { defaultNodeCapacitance, powerSupplyCapacitance } from "../constants"

export class Node {
    voltage: number // in Volts
    netCurrent: number // in Amps
    capacitance: number // in Farads
    originalCapacitance: number // in
    fixed: boolean // GND and VDD nodes are fixed, as are nodes that are being dragged
    historicVoltages: Queue<number>
    schematicEffects: SchematicEffect[] = []

    constructor(initialVoltage: number, isPowerSupply: boolean) {
        const historicVoltages: Queue<number> = new Queue<number>()
        historicVoltages.fill(0, 10)
        const capacitance = isPowerSupply ? powerSupplyCapacitance : defaultNodeCapacitance // in Farads

        this.voltage = initialVoltage // in Volts
        this.netCurrent = 0 // in Amps
        this.capacitance = capacitance
        this.originalCapacitance = capacitance
        this.fixed = isPowerSupply ? true : false // GND and VDD nodes are fixed, as are nodes that are being dragged
        this.historicVoltages = historicVoltages
    }
}
