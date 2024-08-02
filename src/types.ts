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
originX: number,
originY: number,
gradientSize: number,
dots: Point[],
vgs: AngleSlider,
vds: AngleSlider,
Vg: Unit,
Vs: Unit,
Vd: Unit,
Vb: Unit,
}

export type CircuitNode = {
  description: string,
  solveOrder: number,
  assumedVoltageUntilSolved: number,
  solutionProcedure?: ((circuit: Circuit) => number) | null,
  voltage: Unit
}

export type Circuit = {
  devices: {[name: string]: Mosfet},
  nodes: Ref<{[nodeId: string] : CircuitNode}>
}
