import { Point } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { GLOBAL_LINE_THICKNESS } from "../constants"

export class CtxArtist {
    transformationMatrix: TransformationMatrix
    static textTransformationMatrix: TransformationMatrix = new TransformationMatrix()
    static circuitTransformationMatrix: TransformationMatrix = new TransformationMatrix()

    constructor (transformationMatrix: TransformationMatrix = new TransformationMatrix()) {
        this.transformationMatrix = transformationMatrix
    }

    get localLineThickness(): number {
        return this.getLocalLineThickness()
    }

    fillTextGlobalReferenceFrame(ctx: CanvasRenderingContext2D, textLocation: Point, text: string, autoTextAlign: boolean = false, oppositeTextAlign = false, lineHeight: number = 16): Point {
        // switch to the global text reference frame
        CtxArtist.textTransformationMatrix.transformCanvas(ctx)

        // to determine the automatic text alignment, see if the text origin is to the left or right of the caller's origin
        if (autoTextAlign) {
            const globalOrigin = this.transformationMatrix.transformPoint({x: 0, y: 0})
            const globalTextLocation = this.transformationMatrix.transformPoint(textLocation)
            if ((globalTextLocation.x < globalOrigin.x) == (!oppositeTextAlign)) {
                ctx.textAlign = 'right'
            }
            else if ((globalTextLocation.x > globalOrigin.x) == (!oppositeTextAlign)) {
                ctx.textAlign = 'left'
            }
            else {
                ctx.textAlign = 'center'
            }
        }

        const displayTextLocation = CtxArtist.textTransformationMatrix.inverse().transformPoint(this.transformationMatrix.transformPoint(textLocation))
        ctx.fillText(text, displayTextLocation.x, displayTextLocation.y)

        // reset the local reference frame
        this.transformationMatrix.transformCanvas(ctx)
        return this.transformationMatrix.inverse().transformPoint(CtxArtist.textTransformationMatrix.transformPoint({x: displayTextLocation.x, y: displayTextLocation.y + lineHeight}))
    }

    getRelativeScaling(): number {
        return CtxArtist.textTransformationMatrix.relativeScale / this.transformationMatrix.relativeScale
    }

    getLocalLineThickness(lineThickness: number = GLOBAL_LINE_THICKNESS): number {
        return lineThickness * this.getRelativeScaling()
    }
}
