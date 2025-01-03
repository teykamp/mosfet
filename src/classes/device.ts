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

    drawSelectedHalo(ctx: CanvasRenderingContext2D) {
        if (this.selectedFocus.value && !this.isDuplicate) {
            const backgroundGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100)
            backgroundGradient.addColorStop(0, 'rgba(0, 0, 255, 0)')
            backgroundGradient.addColorStop(0.5, 'rgba(0, 0, 255, 0)')
            backgroundGradient.addColorStop(0.8, 'rgba(0, 0, 255, 0.2)')
            backgroundGradient.addColorStop(1, 'rgba(0, 0, 255, 0)')
            ctx.fillStyle = backgroundGradient
            ctx.arc(0, 0, 200, 0, 2 * Math.PI)
            ctx.fill()
        }
    }
}
