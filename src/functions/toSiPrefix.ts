export const toSiPrefix = (n: number, unit: string, sigFigs: number = 3) => {
    if (n == 0) {
        return '0' + unit
    }
    const sign = n >= 0 ? '' : '-'
    const magnitude = Math.abs(n)

    const prefixes: { [key: string]: string } = {
    '30': 'Q',
    '27': 'R',
    '24': 'Y',
    '21': 'Z',
    '18': 'E',
    '15': 'P',
    '12': 'T',
    '9': 'G',
    '6': 'M',
    '3': 'k',
    '0': '',
    '-3': 'm',
    '-6': 'µ',
    '-9': 'n',
    '-12': 'p',
    '-15': 'f',
    '-18': 'a',
    '-21': 'z',
    '-24': 'y',
    '-27': 'r',
    '-30': 'q',
    }
    const exponent = Math.floor(Math.log10(magnitude) / 3) * 3
    let prefix = prefixes[exponent.toString()]
    if (prefix == undefined) {
        prefix = 'e' + exponent.toString() + ' '
    }
    const mantissa = parseFloat((magnitude / (10 ** exponent)).toPrecision(sigFigs))
    return sign + mantissa + prefix + unit
}
