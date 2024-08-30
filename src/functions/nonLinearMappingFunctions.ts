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
    let negativeCurrent = false

    if (current == 0) {
        return 0
    }
    if (current < 0) {
      current = Math.abs(current)
      negativeCurrent = true
    }
    if (current > unityCurrent) {
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

    return negativeCurrent ? -dotSpeed : dotSpeed
}
