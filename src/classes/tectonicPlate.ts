import { Line, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { computed, ComputedRef, Ref } from 'vue'
import { getLineLength, getPointAlongLine } from "../functions/drawFuncs"

export class TectonicPlate extends CtxArtist {
    static allTectonicPlates: TectonicPlate[] = []
    currentLocation: Point = {x: 0, y: 0}
    homeLocation: ComputedRef<Point>
    desiredLocation: ComputedRef<Point>
    locationIsFunctionOfChartVisibility: boolean
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], desiredLocation: ComputedRef<Point> = computed(() => {return {x: 0, y: 0}}), locationIsFunctionOfChartVisibility: boolean = false, homeLocation: ComputedRef<Point> = computed(() => {return {x: 0, y: 0}}), anchorPoints: {[name: string]: Point} = {}) {
        super(parentTransformations, new TransformationMatrix())
        this.desiredLocation = desiredLocation
        this.locationIsFunctionOfChartVisibility = locationIsFunctionOfChartVisibility
        this.homeLocation = homeLocation
        this.anchorPoints = anchorPoints
        TectonicPlate.allTectonicPlates.push(this)
    }

    moveTowardDesiredLocation() {
        this.moveTowardLocation(this.desiredLocation.value)
    }

    moveTowardHomeLocation() {
        this.moveTowardLocation(this.homeLocation.value)
    }

    moveTowardLocation(desiredLocation: Point) {
        const currentLocation = this.currentLocation
        const lineToTravel: Line = {start: currentLocation, end: desiredLocation}

        let newLocation: Point = {x: 0, y: 0}
        if (getLineLength(CtxArtist.textTransformationMatrix.transformLine(lineToTravel)) < 0.1) {
            newLocation = desiredLocation
        } else {
            newLocation = getPointAlongLine(lineToTravel, 0.1) // 0.3
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
        // return CtxArtist.circuitTransformationMatrix.inverse().multiply(this.transformationMatrix).transformPoint(this.point)
        return this.transformations[0].value.inverse().multiply(this.transformationMatrix).transformPoint(this.point)
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
