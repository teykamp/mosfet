
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
    minValue: minValue, // TODO: rename this to voltageDifference or something
    maxValue: maxValue, // TODO: rename this to voltageDifference or something
    value: minValue, // TODO: rename this to voltageDifference or something
    displayText: name,
    displayTextLocation: CCW ? RelativeDirection.Right : RelativeDirection.Left,
    visibility: visibility,
    data: generateCurrent() // TODO: this should not be calculated here
  }
}

export const makeMosfet = (originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5): Mosfet => {
  const originXcanvas = originX * schematicScale + schematicOrigin.x
  const originYcanvas = originY * schematicScale + schematicOrigin.y

  const mosfet: Mosfet = {
    mosfetType: 'nmos',
    originX: originXcanvas,
    originY: originYcanvas,
    gradientSize: 100,
    dots: [
      { x: originXcanvas - 10, y: originYcanvas - 60 },
      { x: originXcanvas - 10, y: originYcanvas - 40 },
      { x: originXcanvas - 10, y: originYcanvas - 20 },
      { x: originXcanvas - 10, y: originYcanvas      },
      { x: originXcanvas - 10, y: originYcanvas + 20 },
      { x: originXcanvas - 10, y: originYcanvas + 40 },
    ],
    vgs: makeAngleSlider(originXcanvas + 15, originYcanvas + 10, 60, toRadians(75), toRadians(5), true, 0, maxVgs, 'Vgs', Visibility.Visible),
    vds: makeAngleSlider(originXcanvas + 30, originYcanvas, 75, toRadians(140), toRadians(-140), false, 0, maxVds, 'Vds', Visibility.Visible),
    Vg: Vg,
    Vs: Vs,
    Vd: Vd,
    Vb: Vb,
    current: 0, // to be updated immediately
    saturationLevel: 0, // to be updated immediately
  }
  mosfet.current = getMosfetCurrent(mosfet)
  mosfet.saturationLevel = getMosfetSaturationLevel(mosfet)
  return mosfet
}

export const getMosfetCurrent = (mosfet: Mosfet): number => {
  // console.log(mosfet)
  // console.log(mosfet.Vg)
  // console.log(mosfet.Vs)
  // console.log(mosfet.Vd)
  // console.log(mosfet.Vb)
  const current: Unit = ekvNmos(unit(mosfet.Vg.value.voltage, 'V'), unit(mosfet.Vs.value.voltage, 'V'), unit(mosfet.Vd.value.voltage, 'V'), unit(mosfet.Vb.value.voltage, 'V')).I
  return current.toNumber('A')
}

export const getMosfetSaturationLevel = (mosfet: Mosfet): number => {
  const saturationLevel = ekvNmos(unit(mosfet.Vg.value.voltage, 'V'), unit(mosfet.Vs.value.voltage, 'V'), unit(mosfet.Vd.value.voltage, 'V'), unit(mosfet.Vb.value.voltage, 'V')).saturationLevel
  return saturationLevel
}
