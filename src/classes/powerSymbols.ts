import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from "vue"

export class GndSymbol extends CtxArtist{
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], origin: Point) {
        super(parentTransformations, new TransformationMatrix().translate(origin))
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)
        const symbolSize = 0.8

        ctx.strokeStyle = 'black'
        ctx.lineWidth = this.localLineThickness
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(symbolSize / 2, 0)
        ctx.lineTo(0, symbolSize / 2)
        ctx.lineTo(-symbolSize / 2, 0)
        ctx.lineTo(0, 0)
        ctx.stroke()

    }
}

export class VddSymbol extends CtxArtist{
    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], origin: Point) {
        super(parentTransformations, new TransformationMatrix().translate(origin))
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)
        const symbolSize = 0.8

        ctx.strokeStyle = 'black'
        ctx.lineWidth = this.localLineThickness
        ctx.beginPath()
        ctx.moveTo(symbolSize / 2, 0)
        ctx.lineTo(-symbolSize / 2, 0)
        ctx.stroke()
    }
}
