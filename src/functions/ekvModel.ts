import { add, subtract, multiply, divide, pow, exp, log, unit, type Unit } from 'mathjs'

export const ekvNmos = (Vg: Unit, Vs: Unit = unit(0, 'V'), Vd: Unit = unit(5, 'V'), Vb: Unit = unit(0, 'V')) => {
  const Vgb = subtract(Vg, Vb)
  const Vsb = subtract(Vs, Vb)
  const Vdb = subtract(Vd, Vb)

  const UT = unit(25.6, 'mV')
  const VT0 = unit(0.6480, 'V')
  const Kappa = 0.7051
  const Is = unit(1.640e-6, 'A')

  // const IF = Is * (np.log(1 + np.exp((Kappa * (Vgb - VT0) - Vsb) / (2 * UT)))) ** 2
  const IF_exponent = divide(subtract(multiply(Kappa, subtract(Vgb, VT0)), Vsb), multiply(2, UT))
  const IF = multiply(Is, pow(log(add(1, exp((IF_exponent as number)))), 2))

  // IR = Is * (np.log(1 + np.exp((Kappa * (Vgb - VT0) - Vdb) / (2 * UT)))) ** 2
  const IR_exponent = divide(subtract(multiply(Kappa, subtract(Vgb, VT0)), Vdb), multiply(2, UT))
  const IR = multiply(Is, pow(log(add(1, exp((IR_exponent as number)))), 2))

  const I = add(subtract(IF, IR), unit(1, 'fA')) as Unit
  const saturationLevel = divide(I, IF) as number
  return {
    I,
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
  const IF = multiply(Is, pow(log(add(1, exp((IF_exponent as number)))), 2))

  // IR = Is * (np.log(1 + np.exp((Kappa * (Vbg - VT0) - Vbd) / (2 * UT)))) ** 2
  const IR_exponent = divide(subtract(multiply(Kappa, subtract(Vbg, VT0)), Vbd), multiply(2, UT))
  const IR = multiply(Is, pow(log(add(1, exp((IR_exponent as number)))), 2))

  const I = add(subtract(IF, IR), unit(1, 'fA')) as Unit
  const saturationLevel = divide(I, IF) as number
  return {
    I,
    saturationLevel
  }
}
