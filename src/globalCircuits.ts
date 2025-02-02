import { ref, shallowRef } from "vue"
import { circuits, DefinedCircuits } from "./circuits/circuits"

export const currentCircuit = ref<DefinedCircuits>('nMosSingle')
export const circuitsToChooseFrom = Object.keys(circuits) as DefinedCircuits[]
export const circuit = shallowRef(circuits[currentCircuit.value])
