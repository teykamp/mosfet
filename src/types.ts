import { Ref } from 'vue'

export type Point = {
  x: number
  y: number
}

export type TransformParameters = {
  rotation: number,
  mirror: {x: boolean, y: boolean},
  scale: {x: number, y: number},
  translation: {x: number, y: number},
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

export type AngleSlider = {
  dragging: boolean
  location: Point,
  radius: number,
  center: Point,
  startAngle: number,
  endAngle: number,
  CCW: boolean,
  displayText: string,
  displayTextLocation: RelativeDirection,
  minValue: number,
  maxValue: number,
  value: number, // a number between minValue and maxValue
  visibility: Visibility
  data: Point[],
  displayNegative: boolean,
}

export type SchematicEffect = {
  node: Ref<Node>,
  origin: Point,
  color: string,
  gradientSize: number,
}

export type Mosfet = {
  mosfetType: 'nmos' | 'pmos',
  originX: number,
  originY: number,
  mirror: boolean,
  dots: Point[],
  gradientSize: number,
  schematicEffects: SchematicEffect[],
  vgs: AngleSlider,
  vds: AngleSlider,
  Vg: Ref<Node>,
  Vs: Ref<Node>,
  Vd: Ref<Node>,
  Vb: Ref<Node>,
  current: number, // in Amps
  saturationLevel: number, // as a fraction of total saturation (0 to 1)
  forwardCurrent: number // in Amps
}

export type VoltageSource = {
  originX: number,
  originY: number,
  voltageDrop: AngleSlider,
  vplus: Ref<Node>,
  vminus: Ref<Node>,
  schematicEffects: SchematicEffect[],
  current: number, // in Amps
  fixedAt: 'gnd' | 'vdd',
}

export type Wire = {
  endPoints: {[name: string]: Point},
  lines: {start: Point, end: Point}[]
}

export type Line = {
  start: Point,
  end: Point,
}

export type Schematic = {
  vddLocations: Point[], // a list of locations to draw vdd symbols
  gndLocations: Point[], // a list of locations to draw gnd symbols
}

export type Node = {
  voltage: number, // in Volts
  netCurrent: number, // in Amps
  capacitance: number, // in Farads
  originalCapacitance: number // in
  fixed: boolean, // GND and VDD nodes are fixed, as are nodes that are being dragged
  historicVoltages: Queue<number>,
  lines: Line[],
}

export type Circuit = {
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
