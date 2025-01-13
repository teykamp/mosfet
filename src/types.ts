import { Ref } from 'vue'
import { Node } from './classes/node'
import { TectonicLine, TectonicPoint } from './classes/tectonicPlate';

export type PublicInterface<T> = Pick<T, keyof T>;

export type Named<T> = {
  name: string,
  selectionChanged: Ref<boolean>,
  deviceSelected: Ref<boolean>,
  value: T,
}

export type Point = {
  x: number
  y: number
}

export type Visibility = 'hidden' | 'locked' | 'visible'

export type canvasId = 'main' | 'mosfet' | 'chart'

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

export interface ReactiveHtmlSlider {
  temporaryMinValue: number,
  temporaryMaxValue: number,
  value: number,
  name: string,
  dragging: boolean,
  updateNodeVoltagesBasedOnValue: () => void,
  releaseSlider: () => void,
}
