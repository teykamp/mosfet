import { Circuit } from "../types"
import nMosSingle from "./nMosSingle"
import nMosDiffPair from "./nMosDiffPair"
import pMosSingle from "./pMosSingle"

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle(),
    'nMosCurrentMirror': nMosSingle(),
    'nMosDiffPair': nMosDiffPair(),
    'pMosSingle': pMosSingle(),
}
