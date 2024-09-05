import { Line, Point } from "../types"
import { Queue } from "./queue"
import { defaultNodeCapacitance, powerSupplyCapacitance } from "../constants"
import { TectonicLine } from "./tectonicPlate"
import { markRaw } from "vue"
// import { ref, Ref } from "vue"

export class Node {
    voltage: number // in Volts
    netCurrent: number // in Amps
    capacitance: number // in Farads
    originalCapacitance: number // in
    fixed: boolean // GND and VDD nodes are fixed, as are nodes that are being dragged
    historicVoltages: Queue<number>
    _lines: TectonicLine[]
    voltageDisplayLabel: string
    voltageDisplayLocations: Point[]

    constructor(initialVoltage: number, isPowerSupply: boolean, lines: TectonicLine[] = [], voltageDisplayLabel: string = "", voltageDisplayLocations: Point[] = []) {
        const historicVoltages: Queue<number> = new Queue<number>()
        historicVoltages.fill(0, 10)
        const capacitance = isPowerSupply ? powerSupplyCapacitance : defaultNodeCapacitance // in Farads

        this.voltage = initialVoltage // in Volts
        this.netCurrent = 0 // in Amps
        this.capacitance = capacitance
        this.originalCapacitance = capacitance
        this.fixed = isPowerSupply ? true : false // GND and VDD nodes are fixed, as are nodes that are being dragged
        this.historicVoltages = historicVoltages
        this._lines = markRaw(lines) // https://stackoverflow.com/a/73940781
        this.voltageDisplayLabel = voltageDisplayLabel
        this.voltageDisplayLocations = voltageDisplayLocations
    }

    get lines(): Line[] {
        return this._lines.map((line: TectonicLine) => line.toLine())
    }
}
