import { Circuit } from "../types"
import nMosSingle from "./nMosSingle"

export const circuits: {[name: string]: Circuit} = {
    'nMosSingle': nMosSingle(),
    'nMosCurrentMirror': nMosSingle(),
    'nMosDiffPair': nMosSingle(),
}
