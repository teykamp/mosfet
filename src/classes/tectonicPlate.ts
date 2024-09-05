import { Line, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { computed, ComputedRef, Ref } from 'vue'
import { getLineLength, getPointAlongLine } from "../functions/drawFuncs"

export class TectonicPlate extends CtxArtist{
    currentLocation: Point = {x: 0, y: 0}
    desiredLocation: ComputedRef<Point>
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], desiredLocation: ComputedRef<Point> = computed(() => {return {x: 0, y: 0}})) {
        super(parentTransformations, new TransformationMatrix())
        this.desiredLocation = desiredLocation
    }

    moveTowardDesiredLocation() {
        const currentLocation = this.currentLocation
        const desiredLocation = this.desiredLocation.value
        console.log("currentLocation: ", currentLocation, "desiredLocation", desiredLocation)
        const lineToTravel: Line = {start: currentLocation, end: desiredLocation}
        console.log(getLineLength(CtxArtist.textTransformationMatrix.transformLine(lineToTravel)))

        let newLocation: Point = {x: 0, y: 0}
        if (getLineLength(CtxArtist.textTransformationMatrix.transformLine(lineToTravel)) < 0.5) {
            newLocation = desiredLocation
        } else {
            newLocation = getPointAlongLine(lineToTravel, 0.3)
        }
        this.moveTo(newLocation)
        this.currentLocation = newLocation
    }
}
