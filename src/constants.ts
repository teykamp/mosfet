import { Point } from './types'

export const schematicOrigin: Point = {x: 250, y: 250} // coordinates of the center of the schematic on the canvas
export const schematicScale: number = 30 // a mosfet is 4 grid units tall and 2 grid units wide

// node definitions
export const gndNodeId: string = "GND"
export const vddNodeId: string = "VDD"
export const gndVoltage: number = 0 // Volts
export const vddVoltage: number = 5 // Volts
