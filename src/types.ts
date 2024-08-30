import { Ref } from 'vue'
import { Matrix } from 'ts-matrix'
import { Node } from './classes/node'

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

export type Chart = {
  points: Point[]
  xAxisLabel: string
  yAxisLabel: string
  xUnit: string
  yUnit: string
  width?: number
  height?: number
  cornerToCornerGraph?: boolean
}

// export type AngleSlider = {
//   transformationMatrix: Matrix,
//   textTransformationMatrix: Matrix,
//   dragging: boolean,
//   preciseDragging: boolean,
//   location: Point,
//   radius: number,
//   originalRadius: number,
//   // center: Point, // obsolete
//   // startAngle: number, // obsolete
//   endAngle: number,
//   // CCW: boolean, // obsolete
//   displayText: string,
//   displayTextLocation: RelativeDirection,
//   minValue: number,
//   maxValue: number,
//   value: number, // a number between minValue and maxValue
//   visibility: Visibility
//   data: Point[],
//   displayNegative: boolean,
//   temporaryMinValue: number,
//   temporaryMaxValue: number,
//   previousValue: number,
//   valueRateOfChange: number,
// }

export type SchematicEffect = {
  node: Ref<Node>,
  origin: Point,
  color: string,
  gradientSize: number,
}

// export type Mosfet = {
//   transformationMatrix: Matrix,
//   textTransformationMatrix: Matrix,
//   mosfetType: 'nmos' | 'pmos',
//   // originX: number, // obsolete
//   // originY: number, // obsolete
//   mirror: boolean, // obsolete
//   dotPercentage: number,
//   gradientSize: number,
//   schematicEffects: {[name: string]: SchematicEffect},
//   vgs: AngleSlider,
//   vds: AngleSlider,
//   Vg: Ref<Node>,
//   Vs: Ref<Node>,
//   Vd: Ref<Node>,
//   Vb: Ref<Node>,
//   current: number, // in Amps
//   saturationLevel: number, // as a fraction of total saturation (0 to 1)
//   forwardCurrent: number // in Amps
// }

// export type VoltageSource = {
//   transformationMatrix: Matrix,
//   textTransformationMatrix: Matrix,
//   // originX: number, // obsolete
//   // originY: number, // obsolete
//   voltageDrop: AngleSlider,
//   vplus: Ref<Node>,
//   vminus: Ref<Node>,
//   schematicEffects: {[name: string]: SchematicEffect},
//   current: number, // in Amps
//   fixedAt: 'gnd' | 'vdd',
// }

export type Wire = {
  node: Ref<Node>,
  lines: Line[],
  label: string,
  locations: Point[],
}

export type Line = {
  start: Point,
  end: Point,
}

export type Circle = {
  center: Point,
  outerDiameter: number,
}

// export type Schematic = {
//   vddLocations: Point[], // a list of locations to draw vdd symbols
//   gndLocations: Point[], // a list of locations to draw gnd symbols
//   parasiticCapacitors: ParasiticCapacitor[],
// }

// export type ParasiticCapacitor = {
//   transformationMatrix: Matrix,
//   textTransformationMatrix: Matrix,
//   circuitTransformationMatrix: Matrix,
//   node: Ref<Node>,
//   extraNodeLines: Line[],
//   currentPath: Line[],
//   dotPercentage: number,
// }

// export type Node = {
//   voltage: number, // in Volts
//   netCurrent: number, // in Amps
//   capacitance: number, // in Farads
//   originalCapacitance: number // in
//   fixed: boolean, // GND and VDD nodes are fixed, as are nodes that are being dragged
//   historicVoltages: Queue<number>,
//   lines: Line[],
//   voltageDisplayLabel: string,
//   voltageDisplayLocations: Point[],
// }

export type Circuit = {
  transformationMatrix: Matrix,
  textTransformationMatrix: Matrix,
  schematic: Schematic, // how to draw the circuit
  // drawSchematic: () => void, // a function to draw the non-device parts of the circuit
  devices: {
    mosfets: {[name: string]: Mosfet}, // a dictionary mapping the names of the mosfets with Mosfet devices
    voltageSources: {[name: string]: VoltageSource}, // a dictionary mapping the names of the voltage sources with VoltageSource devices
  },
  allSliders: AngleSlider[], // a list of all the AngleSliders belonging to all of the devices, to make it easier to loop over them
  nodes: {[nodeId: string]: Ref<Node>}, // a dictionary mapping the names of the nodes in the circuit with their voltages (in V)
  // solveNodeVoltages: (circuit: Circuit) => void, // a function that returns a list of the voltages (in V) at each of the nodes of the circuit
  // checkKirchoffsLaws: () => void, // a function that runs a series of assertions ensuring that KCL and KVL hold within a small tolerance
}

export class Queue<T> { // from https://www.basedash.com/blog/how-to-implement-a-queue-in-typescript
  public items: T[] = [];

  enqueue(item: T): void {
      this.items.push(item);
  }

  dequeue(): T | undefined {
      return this.items.shift();
  }

  peek(): T | undefined {
      return this.items[0];
  }

  isEmpty(): boolean {
      return this.items.length === 0;
  }

  size(): number {
      return this.items.length;
  }

  toArray(): T[] {
    return this.items
  }

  fill(item: T, size: number) {
    this.items = Array(size).fill(item)
  }
}
