import { Line } from "../types";
import { CtxArtist } from "./ctxArtist";
import { CurrentDots } from "./currentDots";
import { TransformationMatrix } from "./transformationMatrix";

export class CurrentCarrier extends CtxArtist {
    currentDots: CurrentDots
    _current: number // in Amps

    constructor(parentTransformationMatrix: TransformationMatrix, currentPath: Line[]) {
        super(parentTransformationMatrix)
        this.currentDots = new CurrentDots(currentPath)
        this._current = 0 // Amps
    }

    updateDotPositionBasedOnTimestamp(timestamp: number) {
        this.currentDots.updateDotPositionBasedOnTimestamp(timestamp, this.current)
    }

    get current(): number { // might be overwritten with a dynamic function
        return this._current
    }

    set current(value: number) {
        this._current = value
    }
}
