import { Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ref, Ref } from "vue"

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

    copy(parentTransformations: Ref<TransformationMatrix>[] | undefined): GndSymbol {
        console.log("logging")
        console.log(this.transformations.map(m => m.value.matrix.values))
        let newTransformations: Ref<TransformationMatrix>[] = parentTransformations ? parentTransformations : []
        for (let i = this.transformations.length - 1; i >= 3; i--) {
            newTransformations = newTransformations.concat(this.transformations[i])
        }
        const newGndSymbol = new GndSymbol(
            newTransformations,
            this.transformations[this.transformations.length - 1].value.translation
        )
        return newGndSymbol
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

    copy(parentTransformations: Ref<TransformationMatrix>[] | undefined): VddSymbol {
        let newTransformations: Ref<TransformationMatrix>[] = parentTransformations ? parentTransformations : []
        for (let i = this.transformations.length - 1; i >= 3; i--) {
            newTransformations = newTransformations.concat(this.transformations[i])
        }
        const newVddSymbol = new VddSymbol(
            newTransformations,
            this.transformations[this.transformations.length - 1].value.translation
        )
        return newVddSymbol
    }
}
