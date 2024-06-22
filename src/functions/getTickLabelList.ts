/**
 * Given a number `n` and an `increment`, find the largest multiple of `increment` which is just smaller than `n`.
 * For example, if `n = 9` and `increment = 4`, the result should be the largest multiple of 4 which does not exeed 9, which is 8.
 * @param n the raw number used as the upper bound for the largest multiple
 * @param increment the result will be a multiple of this number
*/
const getNextRoundMultiple = (n: number, increment: number) => {
    return Math.floor(n / increment) * increment
}

/**
 * Given the range of the data points displayed along an axis of a graph, return a list of tick labels for that axis.
 * There should be between roughly 3 and 8 tick labels which are round numbers and span most of the range of points.
 * For example, for the range from [1.5 to 6.5], appropriate tick labels would be 2, 3, 4, 5, and 6.
 * @param lowerBound the lower range for the data points
 * @param upperBound the upper range for the data points
 * @return a list of the tick labels to be displayed
 */
export const getTickLabelList = (lowerBound: number, upperBound: number) => {
    const difference = upperBound - lowerBound

    let tickSpacing = 10 ** Math.floor(Math.log10(difference))
    const nTicks = Math.floor(difference / tickSpacing)

    // adjust the tick spacing up or down to get within the desired range of ticks
    if (nTicks >= 5) {
        // increasing tick spacing (removing ticks)
        tickSpacing = tickSpacing * 5
    }
    else if (nTicks >= 4) {
        // increasing tick spacing (removing ticks)
        tickSpacing = tickSpacing * 2
    }
    else if (nTicks <= 2) {
        // decreasing tick spacing (adding more ticks)
        tickSpacing = tickSpacing / 2
    }

    const starting_tick = getNextRoundMultiple(lowerBound, tickSpacing)
    let next_tick = starting_tick
    let ticks: number[] = []
    while (next_tick <= upperBound) {
        ticks.push(next_tick)
        next_tick = next_tick + tickSpacing
    }
    ticks.push(next_tick) // one more time

    return ticks
}

const unconvertLog = (n: number) => {
    if (Math.abs(Math.round(n) - n) < 0.1) {
        return 10 ** Math.round(3 * n)
    }
    else {
        return 5 * 10 ** Math.floor(3 * n)
    }
}

export const getTickLabelListLog = (lowerBound: number, upperBound: number) => {
    if (lowerBound <= 0) console.error(`Lower bound, ${lowerBound} <= 0. Log will return NaN`)

    const logLowerBound = Math.log10(lowerBound) / 3
    const logUpperBound = Math.log10(upperBound) / 3

    const difference = logUpperBound - logLowerBound
    if (difference < 1) {
        // Resorting to linear
        return getTickLabelList(lowerBound, upperBound)
    }

    const logTicks = getTickLabelList(logLowerBound, logUpperBound)
    return logTicks.map(unconvertLog)
}
