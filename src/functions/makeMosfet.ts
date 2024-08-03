
import { RelativeDirection, Visibility, Mosfet, AngleSlider, Node } from "../types"
import { schematicOrigin, schematicScale } from "../constants"
import { toRadians } from "./extraMath"
import { ekvNmos, generateCurrent } from "./ekvModel"
import { unit, type Unit } from "mathjs"
import { type Ref } from "vue"

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
    data: generateCurrent() // TODO: this should not be calculated here
  }
}

export const makeMosfet = (originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5): Mosfet => {
  return {
    mosfetType: 'nmos',
    originX: originX * schematicScale + schematicOrigin.x,
    originY: originY * schematicScale + schematicOrigin.y,
    gradientSize: 100,
    dots: [
      { x: originX - 10, y: originY - 60 },
      { x: originX - 10, y: originY - 40 },
      { x: originX - 10, y: originY - 20 },
      { x: originX - 10, y: originY      },
      { x: originX - 10, y: originY + 20 },
      { x: originX - 10, y: originY + 40 },
    ],
    vgs: makeAngleSlider(originX + 15, originY + 10, 60, toRadians(75), toRadians(5), true, 0, maxVgs, 'Vgs', Visibility.Visible),
    vds: makeAngleSlider(originX + 30, originY, 75, toRadians(140), toRadians(-140), false, 0, maxVds, 'Vds', Visibility.Locked),
    Vg: Vg,
    Vs: Vs,
    Vd: Vd,
    Vb: Vb,
  }
}

export const getMosfetCurrent = (mosfet: Mosfet): number => {
  const current: Unit = ekvNmos(unit(mosfet.Vg.value.voltage, 'V'), unit(mosfet.Vs.value.voltage, 'V'), unit(mosfet.Vd.value.voltage, 'V'), unit(mosfet.Vb.value.voltage, 'V')).I
  return current.toNumber('A')
}
