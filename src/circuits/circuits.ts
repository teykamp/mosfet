import { Circuit } from "../types"
import nMosSingle from "./nMosSingle"
import nMosDiffPair from "./nMosDiffPair"

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle(),
    'nMosCurrentMirror': nMosSingle(),
    'nMosDiffPair': nMosDiffPair(),
}
