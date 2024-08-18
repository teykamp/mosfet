
import { Point, RelativeDirection, Visibility, Mosfet, AngleSlider, Node, Queue, Line, VoltageSource, Circuit } from "../types"
import { toRadians } from "./extraMath"
import { ekvNmos, ekvPmos, generateCurrent } from "./ekvModel"
import { defaultNodeCapacitance, powerSupplyCapacitance } from "../constants"
import { unit, type Unit } from "mathjs"
import { ref, type Ref } from "vue"
import { Matrix } from 'ts-matrix'

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

export const makeAngleSlider = (circuitTransformationMatrix: Matrix, parentTransformationMatrix: Matrix, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, CCW: boolean, minValue: number, maxValue: number, name: string, visibility: Visibility, displayNegative: boolean = false): AngleSlider => {
  return {
    transformationMatrix: parentTransformationMatrix.multiply(new Matrix(3, 3, [ // scale
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ])).multiply(new Matrix(3, 3, [ // shift
      [1, 0, centerX],
      [0, 1, centerY],
      [0, 0, 1]
    ])).multiply(new Matrix(3, 3, [ // rotate
      [Math.cos(startAngle), -Math.sin(startAngle), 0],
      [Math.sin(startAngle),  Math.cos(startAngle), 0],
      [0                   , 0                    , 1]
    ])).multiply(new Matrix(3, 3, [ // mirror
      [1, 0, 0],
      [0, (CCW ? -1 : 1), 0],
      [0, 0, 1]
    ])),
    textTransformationMatrix: circuitTransformationMatrix,
    dragging: false,
    preciseDragging: false,
    location: {
      x: 0,
      y: 0,
    },
    // center: {
    //   x: centerX,
    //   y: centerY
    // },
    radius: radius,
    originalRadius: radius,
    // startAngle: startAngle,
    endAngle: endAngle,
    // CCW: CCW,
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

export const makeVoltageSource = (textTransformationMatrix: Matrix, parentTransformationMatrix: Matrix, origin: Point, vminus: Ref<Node>, vplus: Ref<Node>, name: string, fixedAt: 'gnd' | 'vdd', mirror: boolean = false): VoltageSource => {

  const voltageSource = {
    transformationMatrix: parentTransformationMatrix.multiply(new Matrix(3, 3, [[1/30 * (mirror ? -1 : 1), 0, origin.x], [0, 1/30, origin.y], [0, 0, 1]])),
    textTransformationMatrix: textTransformationMatrix,
    vplus: vplus,
    vminus: vminus,
    fixedAt: fixedAt,
    voltageDrop: makeAngleSlider(new Matrix(3, 3), new Matrix(3, 3), 0, 0, 0, 0, 0, false, 0, 0, '', Visibility.Hidden), // to be updated immediately
    schematicEffects: [],
    current: 0 // Amps
  }
  voltageSource.voltageDrop = makeAngleSlider(textTransformationMatrix, voltageSource.transformationMatrix, 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, Visibility.Visible)
  return voltageSource
}

export const makeMosfet = (textTransformationMatrix: Matrix, parentTransformationMatrix: Matrix, mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, mirror: boolean = false, vgsVisibility: Visibility = Visibility.Visible, vdsVisibility: Visibility = Visibility.Visible): Mosfet => {
  const mosfet: Mosfet = {
    transformationMatrix: parentTransformationMatrix.multiply(new Matrix(3, 3, [[1/30 * (mirror ? -1 : 1), 0, originX], [0, 1/30, originY], [0, 0, 1]])),
    textTransformationMatrix: textTransformationMatrix,
    mosfetType: mosfetType,
    mirror: mirror,
    gradientSize: 100,
    schematicEffects: [
      {
        node: Vg,
        origin: {
          x: 30,
          y: 0,
        },
        color: 'red',
        gradientSize: 2,
      },
      {
        node: Vd,
        origin: {
          x: 0,
          y: 30 * (mosfetType == 'nmos' ? -1 : 1),
        },
        color: 'red',
        gradientSize: 100,
      },
    ],
    dotPercentage: 0,
    vgs: makeAngleSlider(new Matrix(3, 3), new Matrix(3, 3), 0, 0, 0, 0, 0, false, 0, 1, '', Visibility.Hidden), // to be updated immediately
    vds: makeAngleSlider(new Matrix(3, 3), new Matrix(3, 3), 0, 0, 0, 0, 0, false, 0, 1, '', Visibility.Hidden), // to be updated immediately
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

  if (mosfet.mosfetType == 'nmos') {
    mosfet.vgs = makeAngleSlider(textTransformationMatrix, mosfet.transformationMatrix, 10, 10, 60, toRadians(75), toRadians(70), true, 0, maxVgs, 'Vgs', vgsVisibility)
    mosfet.vds = makeAngleSlider(textTransformationMatrix, mosfet.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, 0, maxVds, 'Vds', vdsVisibility)
  }
  else {
    mosfet.vgs = makeAngleSlider(textTransformationMatrix, mosfet.transformationMatrix, 10, -10, 60, toRadians(-5), toRadians(70), true, -maxVgs, 0, 'Vsg', vgsVisibility, true)
    mosfet.vds = makeAngleSlider(textTransformationMatrix, mosfet.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, -maxVds, 0, 'Vsd', vdsVisibility, true)
  }

  return mosfet
}

const getMosfetEkvResult = (mosfet: Mosfet): { I: Unit, saturationLevel: number, IF: Unit } => {
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
