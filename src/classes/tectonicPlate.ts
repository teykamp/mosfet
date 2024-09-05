import { Line, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { computed, ComputedRef, Ref } from 'vue'
import { getLineLength, getPointAlongLine } from "../functions/drawFuncs"

export class TectonicPlate extends CtxArtist {
    static allTectonicPlates: TectonicPlate[] = []
    currentLocation: Point = {x: 0, y: 0}
    desiredLocation: ComputedRef<Point>
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], desiredLocation: ComputedRef<Point> = computed(() => {return {x: 0, y: 0}}), anchorPoints: {[name: string]: Point} = {}) {
        super(parentTransformations, new TransformationMatrix())
        this.desiredLocation = desiredLocation
        this.anchorPoints = anchorPoints
        TectonicPlate.allTectonicPlates.push(this)
    }

    moveTowardDesiredLocation() {
        console.log(this.transformationMatrix.translation)

        const currentLocation = this.currentLocation
        const desiredLocation = this.desiredLocation.value
        const lineToTravel: Line = {start: currentLocation, end: desiredLocation}

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

export class TectonicPoint extends CtxArtist {
    point: Point
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], point: Point = {x: 0, y: 0}) {
        super(parentTransformations, new TransformationMatrix())
        this.point = point
    }

    toPoint(): Point {
        return CtxArtist.circuitTransformationMatrix.inverse().multiply(this.transformationMatrix).transformPoint(this.point)
    }
}

export class TectonicLine {
    start: TectonicPoint
    end: TectonicPoint

    constructor(startParentTransformations: Ref<TransformationMatrix>[], startPoint: Point, endParentTransformations: Ref<TransformationMatrix>[], endPoint: Point) {
        this.start = new TectonicPoint(startParentTransformations, startPoint)
        this.end = new TectonicPoint(endParentTransformations, endPoint)
    }

    toLine(): Line {
        return {start: this.start.toPoint(), end: this.end.toPoint()}
    }
}
