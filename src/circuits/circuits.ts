import { Circuit } from "../types"
import nMosSingle from "./nMosSingle"
import nMosDiffPair from "./nMosDiffPair"
import nMos5TransistorOpAmp from "./nMos5TransistorOpAmp"
import pMosSingle from "./pMosSingle"

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle(),
    'nMosCurrentMirror': nMosSingle(),
    'nMosDiffPair': nMosDiffPair(),
    'pMosSingle': pMosSingle(),
    'nMos5TransistorOpAmp': nMos5TransistorOpAmp(),
}
