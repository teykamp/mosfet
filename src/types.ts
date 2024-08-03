import { Ref } from 'vue'
import { Unit } from "mathjs"

export type Point = {
  x: number
  y: number
}

export enum Visibility {
  Hidden,
  Locked,
  Visible
}

export enum RelativeDirection {
  Right,
  Left,
  Up,
  Down,
}

export type AngleSlider = {
  dragging: boolean
  location: {
    x: number,
    y: number,
  },
  radius: number,
  center: {
    x: number,
    y: number,
  },
  startAngle: number,
  endAngle: number,
  CCW: boolean,
  displayText: string,
  displayTextLocation: RelativeDirection,
  minValue: number,
  maxValue: number,
  value: number,
  visibility: Visibility
  data: Point[],
}

export type Mosfet = {
  mosfetType: 'nmos' | 'pmos',
  originX: number,
  originY: number,
  dots: Point[],
  gradientSize: number,
  vgs: AngleSlider,
  vds: AngleSlider,
  Vg: Ref<Node>,
  Vs: Ref<Node>,
  Vd: Ref<Node>,
  Vb: Ref<Node>,
}

export type VoltageSource = {
  originX: number,
  originY: number,
  voltageDrop: Unit,
}

// export type Wire = {
//   points: Point[],
//   startColor: color,
//   endColor: color,
// }

export type Schematic = {
  lines: [Point, Point][] // a list of line segments to draw
  vddLocations: Point[], // a list of locations to draw vdd symbols
  gndLocations: Point[], // a list of locations to draw gnd symbols
}

export type Node = {
  voltage: number, // in Volts
  netCurrent: number, // in Amps
  capacitance: number, // in Farads
}

export type Circuit = {
  schematic: Schematic, // how to draw the circuit
  // drawSchematic: () => void, // a function to draw the non-device parts of the circuit
  devices: {
    mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
    voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
  },
  nodes: {[nodeId: string]: Ref<Node>}, // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
  // solveNodeVoltages: (circuit: Circuit) => void, // a function that returns a list of the voltages (in V) at each of the nodes of the circuit
  // checkKirchoffsLaws: () => void, // a function that runs a series of assertions ensuring that KCL and KVL hold within a small tolerance
}
