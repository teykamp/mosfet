import { Point, canvasId } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ref, Ref } from 'vue'
import { getLineLength } from "../functions/drawFuncs"
import { TectonicPoint } from "./tectonicPlate"

export class Device extends CtxArtist{
    isDuplicate: boolean = false
    mouseDownInsideSelectionArea = false
    selected: Ref<boolean> = ref(false)
    selectedFocus: Ref<boolean> = ref(false)
    boundingBox: TectonicPoint[]

    constructor (parentTransformations: Ref<TransformationMatrix>[] = [], localTransformationMatrix: TransformationMatrix = new TransformationMatrix(), canvasId: canvasId = 'main') {
        super(parentTransformations, localTransformationMatrix, canvasId)
        this.boundingBox = [
            new TectonicPoint(this.transformations, {x: -120, y: 0}),
            new TectonicPoint(this.transformations, {x: 120, y: 0}),
            new TectonicPoint(this.transformations, {x: 0, y: -120}),
            new TectonicPoint(this.transformations, {x: 0, y: 120}),
        ]
    }

    checkSelectionArea(mousePosition: Point): boolean {
        const transformedMousePos = this.transformationMatrix.inverse().transformPoint(mousePosition)
        const radius = 60
        return getLineLength({start: {x: 0, y: 0}, end: transformedMousePos}) < radius
    }
}
