import { Ref } from 'vue'
import { Node } from './classes/node'
import { TectonicLine, TectonicPoint } from './classes/tectonicPlate';
import { DefinedCircuits } from './circuits/circuits';

export type PublicInterface<T> = Pick<T, keyof T>;

export type Named<T> = {
  name: string,
  selectionChanged: Ref<boolean>,
  deviceSelected: Ref<boolean>,
  deviceType: 'voltageSource' | 'mosfet' | 'other',
  value: T,
  adjacencyList: DeviceAdjacencyList,
}

export type DeviceAdjacencyList = { [direction: string]: string }

export type Point = {
  x: number
  y: number
}

export type Visibility = 'hidden' | 'locked' | 'visible'

export type canvasId = 'main' | 'mosfet' | 'chart'

export type selectionEvent = 'canvas' | 'htmlSlider' | 'keyboard'
export type mouseSelectionEvent = 'canvas' | 'htmlSlider'

export const DIRECTIONS = ['up', 'down', 'left', 'right']
export const keysToDirections: { [keyPress: string]: string } = {
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'Up': 'up',
  'Down': 'down',
  'Left': 'left',
  'Right': 'right',
}

export type circuitParameters = {
  earlyEffect: boolean,
}

export type incrementCircuitWorkerMessage = [DefinedCircuits, {[key: string]: number}, circuitParameters]

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

export type TutorialData = {
  title: string,
  text: string,
  location?: {
    x: string,
    y: string
  },
  reaction?: () => void,
}
