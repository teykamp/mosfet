import { Mosfet } from "../types"
import { getRelativeScaling } from "./drawFuncs"
import { between } from "./extraMath"
import { interpolateInferno } from 'd3' // https://stackoverflow.com/a/42505940

export const getGradientSizeFromSaturationLevel = (mosfet: Mosfet): number => {
    const maxGradientSize = getRelativeScaling(mosfet.textTransformationMatrix, mosfet.transformationMatrix) * 60
    // 100 % saturation -> 0   % maxGradientSize
    // 50  % saturation -> 50  % maxGradientSize
    // 0   % saturation -> 100 % maxGradientSize
    return maxGradientSize * (1 - mosfet.saturationLevel)
}

export const getForwardCurrentScaled = (mosfet: Mosfet): number => {
    // 50 mA -> colorScale of 1
    // 5 mA -> colorScale of 1
    // 500 uA -> colorScale of 0.8
    // 50 uA -> colorScale of 0.6
    // 5 uA -> colorScale of 0.4
    // 500 nA -> colorScale of 0.2
    // 50 nA -> colorScale of 0
    // 5 nA -> colorScale of 0
    // 500 pA -> colorScale of 0
    // 50 pA -> colorScale of 0
    // 5 pA -> colorScale of 0
    return between(0, 1, Math.log10(mosfet.forwardCurrent / 5e-3) * 0.2 + 1)
}

export const getGateColorFromForwardCurrent = (mosfet: Mosfet): string => {
    const forwardCurrentScaled = getForwardCurrentScaled(mosfet)
    return interpolateInferno(forwardCurrentScaled)
}

export const getDotSpeedFromCurrent = (current: number): number => {
    // 10 mA -> speed of 3
    // 1 mA -> speed of 2
    // 100 uA -> speed of 1 // unityCurrent
    // 10 uA -> speed of 1/4
    // 1 uA -> speed of 1/9
    // 100nA -> speed of 1/16

    const unityCurrent = 1e-4 // Amps
    const unitySpeed = 1 // (100 percent) / s
    let dotSpeed = unitySpeed

    if (current <= 0) {
      dotSpeed = 0
    }
    else if (current > unityCurrent) {
      dotSpeed = (Math.log10(current / unityCurrent) + 1) ** 2 * unitySpeed
    } else {
      dotSpeed = 1 / (1 - Math.log10(current / unityCurrent)) ** 2 * unitySpeed
    }
    if (dotSpeed > 5 * unitySpeed) {
      dotSpeed = 5 * unitySpeed
    }
    else if (dotSpeed < 0.001 * unitySpeed) {
      dotSpeed = 0.001 * unitySpeed
    }

    return dotSpeed
}
