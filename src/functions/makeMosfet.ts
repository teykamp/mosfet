
import { RelativeDirection, Visibility, Mosfet, AngleSlider } from "../types"
import { toRadians } from "./extraMath"
import { ekvNmos, generateCurrent } from "./ekvModel"
import { unit, type Unit } from "mathjs"

export const makeAngleSlider = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility): AngleSlider => {
  return {
    dragging: false,
    location: {
      x: Math.cos(startAngle) * radius + centerX,
      y: Math.sin(startAngle) * radius + centerY,
    },
    center: {x: centerX, y: centerY},
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
    data: generateCurrent()
  }
}

export const makeMosfet = (originX: number, originY: number, Vg: Unit = unit(1, 'V'), Vs: Unit = unit(0, 'V'), Vd: Unit = unit(5, 'V'), Vb: Unit = unit(0, 'V')): Mosfet => {
  return {
    originX: originX,
    originY: originY,
    gradientSize: 100,
    dots: [
      { x: originX - 10, y: originY - 60 },
      { x: originX - 10, y: originY - 40 },
      { x: originX - 10, y: originY - 20 },
      { x: originX - 10, y: originY      },
      { x: originX - 10, y: originY + 20 },
      { x: originX - 10, y: originY + 40 },
    ],
    vgs: makeAngleSlider(originX + 15, originY + 10, 60, toRadians(75), toRadians(5), true, 0, 3, 'Vgs', Visibility.Visible),
    vds: makeAngleSlider(originX + 30, originY, 75, toRadians(140), toRadians(-140), false, 0, 5, 'Vds', Visibility.Locked),
    Vg: Vg,
    Vs: Vs,
    Vd: Vd,
    Vb: Vb
  }
}

export const getMosfetCurrent = (mosfet: MOsfet): Unit => {
  return ekvNmos(mosfet.Vg, mosfet.Vs, mosfet.Vd, mosfet.Vb).I
}
