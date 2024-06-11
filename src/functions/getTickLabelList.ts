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
 * @param lower_bound the lower range for the data points
 * @param upper_bound the upper range for the data points
 * @return a list of the tick labels to be displayed
 */
export const getTickLabelList = (lowerBound: number, upperBound: number) => {

}
