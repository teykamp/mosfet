
import { RelativeDirection, Visibility, Mosfet, AngleSlider } from "../types"
import { toRadians } from "./extraMath"
import { generateCurrent } from "./ekvModel"
import { Ref } from 'vue'
import useDrawCharts from '../composables/useDrawCharts'


export const makeAngleSlider = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility, canvas: Ref<HTMLCanvasElement>): AngleSlider => {
  return {
    dragging: false,
    location: {
      x: Math.cos(startAngle) * radius + centerX,
      y: Math.sin(startAngle) * radius + centerY,
    },
    center: {
      x: centerX, 
      y: centerY
    },
    radius: radius,
    startAngle: startAngle,
    endAngle: endAngle,
    CCW: CCW,
    minValue: minValue,
    maxValue: maxValue,
    value: minValue,
    displayText: name,
    displayTextLocation: CCW ? RelativeDirection.Right : RelativeDirection.Left,
    visibility: visibility,
    chartFunctions: useDrawCharts(canvas, {
      points: generateCurrent(),
      xAxisLabel: 'Vgs',
      yAxisLabel: 'Current',
      xUnit: 'V',
      yUnit: 'A',
    })
  }
}

export const makeMosfet = (originX: number, originY: number, canvas: Ref<HTMLCanvasElement>): Mosfet => {
  return {
    originX: originX,
    originY: originY,
    gradientSize: 100,
    dots: [ // should probably be abstracted so doesn't have to be stored
      { x: originX - 10, y: originY - 60 },
      { x: originX - 10, y: originY - 40 },
      { x: originX - 10, y: originY - 20 },
      { x: originX - 10, y: originY      },
      { x: originX - 10, y: originY + 20 },
      { x: originX - 10, y: originY + 40 },
    ],
    vgs: makeAngleSlider(originX + 15, originY + 10, 60, toRadians(75), toRadians(5), true, 0, 3, 'Vgs', Visibility.Visible, canvas),
    vds: makeAngleSlider(originX + 30, originY, 75, toRadians(140), toRadians(-140), false, 0, 5, 'Vds', Visibility.Locked, canvas),
  }
}
