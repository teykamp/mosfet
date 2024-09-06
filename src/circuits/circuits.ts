import nMosSingle from "./nMosSingle"
import nMosDiffPair from "./nMosDiffPair"
import nMos5TransistorOpAmp from "./nMos5TransistorOpAmp"
import nMos9TransistorOpAmp from "./nMos9TransistorOpAmp"
import pMosSingle from "./pMosSingle"

export const circuits = {
    'nMosSingle': nMosSingle(),
    // 'nMosDiffPair': nMosDiffPair(),
    'pMosSingle': pMosSingle(),
    // 'nMos5TransistorOpAmp': nMos5TransistorOpAmp(),
    // 'nMos9TransistorOpAmp': nMos9TransistorOpAmp(),
}
