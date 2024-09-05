import { Ref } from 'vue'
import { Node } from './classes/node'

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

export type SchematicEffect = {
  node: Ref<Node>,
  origin: Point,
  color: string,
  gradientSize: number,
}

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
