
import { Point, RelativeDirection, Visibility, Mosfet, AngleSlider, Node, Queue, TransformParameters, Line, VoltageSource, Circuit } from "../types"
import { schematicOrigin, schematicScale } from "../constants"
import { toRadians } from "./extraMath"
import { ekvNmos, ekvPmos, generateCurrent } from "./ekvModel"
import { defaultNodeCapacitance, powerSupplyCapacitance } from "../constants"
import { unit, type Unit } from "mathjs"
import { ref, type Ref } from "vue"

export const makeTransformParameters = (rotation: number = 0, mirror: {x: boolean, y: boolean} = {x: false, y: false}, scale: {x: number, y: number} = {x: 1, y: 1}, translation: {x: number, y: number} = {x: 0, y: 0}): TransformParameters => {
  return {
    rotation: rotation,
    mirror: mirror,
    scale: scale,
    translation: translation,
  }
}

export const makeNode = (initialVoltage: number, isPowerSupply: boolean, lines: Line[] = [], voltageDisplayLabel: string = "", voltageDisplayLocations: Point[] = []): Ref<Node> => {
  const historicVoltages: Queue<number> = new Queue<number>()
  historicVoltages.fill(0, 10)
  const capacitance = isPowerSupply ? powerSupplyCapacitance : defaultNodeCapacitance // in Farads
  return ref({
    voltage: initialVoltage, // in Volts
    netCurrent: 0, // in Amps
    capacitance: capacitance,
    originalCapacitance: capacitance,
    fixed: isPowerSupply ? true : false, // GND and VDD nodes are fixed, as are nodes that are being dragged
    historicVoltages: historicVoltages,
    lines: lines,
    voltageDisplayLabel: voltageDisplayLabel,
    voltageDisplayLocations: voltageDisplayLocations
  })
}

export const makeAngleSlider = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility, displayNegative: boolean = false): AngleSlider => {
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
    originalRadius: radius,
    startAngle: startAngle,
    endAngle: endAngle,
    CCW: CCW,
    minValue: minValue, // TODO: rename this to voltageDifference or something
    maxValue: maxValue, // TODO: rename this to voltageDifference or something
    value: minValue, // TODO: rename this to voltageDifference or something
    displayText: name,
    displayTextLocation: CCW ? RelativeDirection.Right : RelativeDirection.Left,
    visibility: visibility,
    data: generateCurrent(), // TODO: this should not be calculated here
    displayNegative: displayNegative,
    temporaryMinValue: minValue,
    temporaryMaxValue: maxValue,
    previousValue: minValue,
    valueRateOfChange: 0,
  }
}

export const getSliderPercentValue = (slider: AngleSlider): number => {
  return (slider.value - slider.minValue) / (slider.maxValue - slider.minValue)
}

export const makeVoltageSource = (origin: Point, vminus: Ref<Node>, vplus: Ref<Node>, name: string, fixedAt: 'gnd' | 'vdd', mirror: boolean = false): VoltageSource => {
  const originXcanvas = origin.x * schematicScale + schematicOrigin.x
  const originYcanvas = origin.y * schematicScale + schematicOrigin.y

  const voltageSource = {
    originX: originXcanvas,
    originY: originYcanvas,
    vplus: vplus,
    vminus: vminus,
    fixedAt: fixedAt,
    voltageDrop: makeAngleSlider(originXcanvas, originYcanvas, 50, toRadians(40), toRadians(-40), true, 0, 5, name, Visibility.Visible),
    schematicEffects: [],
    current: 0 // Amps
  }
  if (mirror) {
    voltageSource.voltageDrop = makeAngleSlider(originXcanvas, originYcanvas, 50, toRadians(140), toRadians(-140), false, 0, 5, name, Visibility.Visible)
  }
  return voltageSource
}

export const makeMosfet = (mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, mirror: boolean = false, vgsVisibility: Visibility = Visibility.Visible, vdsVisibility: Visibility = Visibility.Visible): Mosfet => {
  const originXcanvas = originX * schematicScale + schematicOrigin.x
  const originYcanvas = originY * schematicScale + schematicOrigin.y

  const mosfet: Mosfet = {
    mosfetType: mosfetType,
    originX: originXcanvas,
    originY: originYcanvas,
    mirror: mirror,
    gradientSize: 100,
    schematicEffects: [
      {
        node: Vg,
        origin: {
          x: (originX + 2 * (mirror ? -1 : 1)) * schematicScale + schematicOrigin.x,
          y: (originY)                         * schematicScale + schematicOrigin.y,
        },
        color: 'red',
        gradientSize: 100,
      },
      {
        node: Vd,
        origin: {
          x: originX                                         * schematicScale + schematicOrigin.x,
          y: (originY - 2 * (mosfetType == 'nmos' ? 1 : -1)) * schematicScale + schematicOrigin.y,
        },
        color: 'red',
        gradientSize: 100,
      },
    ],
    dots: [
      { x: originXcanvas - 12, y: originYcanvas - 60 },
      { x: originXcanvas - 12, y: originYcanvas - 40 },
      { x: originXcanvas - 12, y: originYcanvas - 20 },
      { x: originXcanvas - 12, y: originYcanvas      },
      { x: originXcanvas - 12, y: originYcanvas + 20 },
      { x: originXcanvas - 12, y: originYcanvas + 40 },
    ],
    vgs: makeAngleSlider(originXcanvas + 15, originYcanvas + 10, 60, toRadians(75), toRadians(5), true, 0, maxVgs, 'Vgs', vgsVisibility),
    vds: makeAngleSlider(originXcanvas + 30, originYcanvas, 75, toRadians(140), toRadians(220), false, 0, maxVds, 'Vds', vdsVisibility),
    Vg: Vg,
    Vs: Vs,
    Vd: Vd,
    Vb: Vb,
    current: 0, // to be updated immediately
    saturationLevel: 0, // to be updated immediately
    forwardCurrent: 0, // to be updated immediately
  }
  mosfet.current = getMosfetCurrent(mosfet)
  mosfet.saturationLevel = getMosfetSaturationLevel(mosfet)
  mosfet.forwardCurrent = getMosfetForwardCurrent(mosfet)

  if (mosfet.mosfetType == 'pmos') {
    mosfet.vgs = makeAngleSlider(originXcanvas + 15, originYcanvas - 10, 60, toRadians(-75), toRadians(-5), false, 0, -maxVgs, 'Vsg', vgsVisibility, true)
    mosfet.vds = makeAngleSlider(originXcanvas + 30, originYcanvas, 75, toRadians(220), toRadians(140), true, 0, -maxVds, 'Vsd', vdsVisibility, true)
  }

  if (mirror) {
    if (mosfet.mosfetType == 'nmos') {
      mosfet.vgs = makeAngleSlider(originXcanvas - 15, originYcanvas + 10, 60, toRadians(105), toRadians(175), false, 0, maxVgs, 'Vgs', vgsVisibility)
      mosfet.vds = makeAngleSlider(originXcanvas - 30, originYcanvas, 75, toRadians(40), toRadians(-40), true, 0, maxVds, 'Vds', vdsVisibility)
    }
    else if (mosfet.mosfetType == 'pmos') {
      mosfet.vgs = makeAngleSlider(originXcanvas - 15, originYcanvas - 10, 60, toRadians(-105), toRadians(-175), true, 0, -maxVgs, 'Vsg', vgsVisibility, true)
      mosfet.vds = makeAngleSlider(originXcanvas - 30, originYcanvas, 75, toRadians(-40), toRadians(40), false, 0, -maxVds, 'Vsd', vdsVisibility, true)
    }
      mosfet.dots = [
      { x: originXcanvas + 10, y: originYcanvas - 60 },
      { x: originXcanvas + 10, y: originYcanvas - 40 },
      { x: originXcanvas + 10, y: originYcanvas - 20 },
      { x: originXcanvas + 10, y: originYcanvas      },
      { x: originXcanvas + 10, y: originYcanvas + 20 },
      { x: originXcanvas + 10, y: originYcanvas + 40 },
    ]
  }
  return mosfet
}

const getMosfetEkvResult = (mosfet: Mosfet): {I: Unit, saturationLevel: number, IF: Unit} => {
  if (mosfet.mosfetType == 'pmos') {
    return ekvPmos(unit(mosfet.Vg.value.voltage, 'V'), unit(mosfet.Vs.value.voltage, 'V'), unit(mosfet.Vd.value.voltage, 'V'), unit(mosfet.Vb.value.voltage, 'V'))
  }
  else {
    return ekvNmos(unit(mosfet.Vg.value.voltage, 'V'), unit(mosfet.Vs.value.voltage, 'V'), unit(mosfet.Vd.value.voltage, 'V'), unit(mosfet.Vb.value.voltage, 'V'))
  }
}

export const getMosfetCurrent = (mosfet: Mosfet): number => {
  const result = getMosfetEkvResult(mosfet)
  return result.I.toNumber('A')
}

export const getMosfetSaturationLevel = (mosfet: Mosfet): number => {
  const result = getMosfetEkvResult(mosfet)
  return result.saturationLevel
}

export const getMosfetForwardCurrent = (mosfet: Mosfet): number => {
  const result = getMosfetEkvResult(mosfet)
  return result.IF.toNumber('A')
}

export const makeListOfSliders = (circuit: Circuit) => {
  circuit.allSliders = []
  for (const mosfetId in circuit.devices.mosfets) {
    const mosfet = circuit.devices.mosfets[mosfetId]
    circuit.allSliders.push(mosfet.vgs)
    circuit.allSliders.push(mosfet.vds)
  }
    for (const voltageSourceId in circuit.devices.voltageSources) {
      const voltageSource = circuit.devices.voltageSources[voltageSourceId]
      circuit.allSliders.push(voltageSource.voltageDrop)
    }
}
