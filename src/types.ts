import { Ref } from 'vue'

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
}

export type CircuitNode = {
  description: string,
  solveOrder: number,
  assumedVoltageUntilSolved: number,
  solutionProcedure?: ((...args: any) => number) | null,
  voltage: number
}

export type Circuit = {
  devices: Mosfet[],
  nodes: Ref<{[nodeId: string] : CircuitNode}>
}
