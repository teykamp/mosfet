import { add, subtract, multiply, divide, pow, exp, log, unit, type Unit } from 'mathjs'
import { linspace } from '../functions/extraMath'
import { Point } from '../types'

export const ekvNmosNoUnits = (Vg: number, Vs: number = 0, Vd: number = 5, Vb: number = 0) => {
  const Vgb = Vg - Vb
  const Vsb = Vs - Vb
  const Vdb = Vd - Vb

  const UT = 25.6e-3 // V
  const VT0 = 0.6480 // V
  // const Kappa = 0.7051 // this is the value derived in Ian's Lab 4 report
  const Kappa = 0.8051 // this matches closer with the LTSpice model
  const Is = 1.640e-6 // A

  const IF = Is * (Math.log(1 + Math.exp((Kappa * (Vgb - VT0) - Vsb) / (2 * UT)))) ** 2
  const IR = Is * (Math.log(1 + Math.exp((Kappa * (Vgb - VT0) - Vdb) / (2 * UT)))) ** 2

  const I = IF - IR
  const saturationLevel = I / IF
  return {
    I,
    IF,
    saturationLevel
  }
}

export const ekvPmosNoUnits = (Vg: number, Vs: number = 5, Vd: number = 0, Vb: number = 5) => {
  const Vbg = Vb - Vg
  const Vbs = Vb - Vs
  const Vbd = Vb - Vd

  const UT = 25.6e-3 // V
  const VT0 = 0.7283 // V
  const Kappa = 0.7609
  const Is = 6.108e-7 // A

  const IF = Is * (Math.log(1 + Math.exp((Kappa * (Vbg - VT0) - Vbs) / (2 * UT)))) ** 2
  const IR = Is * (Math.log(1 + Math.exp((Kappa * (Vbg - VT0) - Vbd) / (2 * UT)))) ** 2

  const I = IF - IR
  const saturationLevel = I / IF
  return {
    I,
    IF,
    saturationLevel
  }
}

export const ekvNmos = (Vg: Unit, Vs: Unit = unit(0, 'V'), Vd: Unit = unit(5, 'V'), Vb: Unit = unit(0, 'V')) => {
  const Vgb = subtract(Vg, Vb)
  const Vsb = subtract(Vs, Vb)
  const Vdb = subtract(Vd, Vb)

  const UT = unit(25.6, 'mV')
  const VT0 = unit(0.6480, 'V')
  // const Kappa = 0.7051 // this is the value derived in Ian's Lab 4 report
  const Kappa = 0.8051 // this matches closer with the LTSpice model
  const Is = unit(1.640e-6, 'A')

  // const IF = Is * (np.log(1 + np.exp((Kappa * (Vgb - VT0) - Vsb) / (2 * UT)))) ** 2
  const IF_exponent = divide(subtract(multiply(Kappa, subtract(Vgb, VT0)), Vsb), multiply(2, UT))
  const IF = add(multiply(Is, pow(log(add(1, exp((IF_exponent as number)))), 2)), unit(1, 'fA')) as Unit

  // IR = Is * (np.log(1 + np.exp((Kappa * (Vgb - VT0) - Vdb) / (2 * UT)))) ** 2
  const IR_exponent = divide(subtract(multiply(Kappa, subtract(Vgb, VT0)), Vdb), multiply(2, UT))
  const IR = multiply(Is, pow(log(add(1, exp((IR_exponent as number)))), 2))

  const I = subtract(IF, IR) as Unit
  const saturationLevel = divide(I, IF) as number
  return {
    I,
    IF,
    saturationLevel
  }
}

export const ekvPmos = (Vg: Unit, Vs: Unit = unit(5, 'V'), Vd: Unit = unit(0, 'V'), Vb: Unit = unit(5, 'V')) => {
  const Vbg = subtract(Vb, Vg)
  const Vbs = subtract(Vb, Vs)
  const Vbd = subtract(Vb, Vd)

  const UT = unit(25.6, 'mV')
  const VT0 = unit(0.7283, 'V')
  const Kappa = 0.7609
  const Is = unit(6.108e-7, 'A')

  // IF = Is * (np.log(1 + np.exp((Kappa * (Vbg - VT0) - Vbs) / (2 * UT)))) ** 2
  const IF_exponent = divide(subtract(multiply(Kappa, subtract(Vbg, VT0)), Vbs), multiply(2, UT))
  const IF = add(multiply(Is, pow(log(add(1, exp((IF_exponent as number)))), 2)), unit(1, 'fA')) as Unit

  // IR = Is * (np.log(1 + np.exp((Kappa * (Vbg - VT0) - Vbd) / (2 * UT)))) ** 2
  const IR_exponent = divide(subtract(multiply(Kappa, subtract(Vbg, VT0)), Vbd), multiply(2, UT))
  const IR = multiply(Is, pow(log(add(1, exp((IR_exponent as number)))), 2))

  const I = subtract(IF, IR) as Unit
  const saturationLevel = divide(I, IF) as number
  return {
    I,
    IF,
    saturationLevel
  }
}

export const generateSaturationLevel = (currents: Point[]) => {
  const saturationLevels: Point[] = []
  const vds = linspace(0, 1, 1000);
  const saturationLevel = vds.map(n => ekvNmos(unit(1, 'V'), unit(0, 'V'), unit(n, 'V')).saturationLevel * 100) // to percent
  for (let i = 0; i < vds.length; i++) { // used to be current.length from above
    saturationLevels.push({
      x: currents[i].x,
      y: saturationLevel[i]
    })
  }

  return saturationLevels
}

export const generateCurrent = () => {
  const currents: Point[] = []
  const vgs = linspace(0, 1, 1000);
  const current = vgs.map(n => ekvNmos(unit(n, 'V'), unit(0, 'V')).I)
  for (let i = 0; i < current.length; i++) {
    currents.push({
      x: vgs[i],
      y: current[i].toNumber('A')
    })
  }
  return currents
}
