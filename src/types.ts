import { Ref } from 'vue'
import { Node } from './classes/node'
import { TectonicLine, TectonicPoint } from './classes/tectonicPlate';

export type PublicInterface<T> = Pick<T, keyof T>;

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

export type BoundingBox = {
  topLeft: TectonicPoint
  topRight: TectonicPoint
  bottomRight: TectonicPoint
  bottomLeft: TectonicPoint
}

export type SchematicEffect = {
  node: Ref<Node>,
  origin: TectonicPoint,
  color: string,
  gradientSize: number,
}

export type FlattenedSchematicEffect = {
  origin: Point,
  color: string,
  gradientSize: number,
}

export type Wire = {
  node: Ref<Node>,
  lines: TectonicLine[],
  voltageDisplayLabel: string,
  voltageDisplayLocations: TectonicPoint[],
}

export type Line = {
  start: Point,
  end: Point,
}

export type Circle = {
  center: Point,
  outerDiameter: number,
}
