import { canvasId, Point } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { GLOBAL_LINE_THICKNESS } from "../constants"
import { computed, ComputedRef, ref, Ref } from "vue"
import { foldl } from "../functions/extraMath"

export class CtxArtist {
    transformations: Ref<TransformationMatrix>[] = []
    anchorPoints: {[name: string]: Point} = {}
    _transformationMatrix: ComputedRef<TransformationMatrix>
    canvasId: canvasId

    static textTransformationMatrix: TransformationMatrix = new TransformationMatrix()
    static circuitTransformationMatrix: TransformationMatrix = new TransformationMatrix()
    static allCtxArtists: CtxArtist[] = []

    constructor (parentTransformations: Ref<TransformationMatrix>[] = [], localTransformationMatrix: TransformationMatrix = new TransformationMatrix(), canvasId: canvasId = 'main') {
        // this.transformations: [ ref(topLevelTM), ref(circuitTM), ref(mosfetTM), ref(angleSliderTM), ref(thisTM) ]
        // if you change the last element of this.transformations[this.transformations.length - 1], it will propagate down to all children
        parentTransformations.forEach(transformation => {this.transformations.push(transformation)}) // make a shallow copy of the array
        this.transformations.push(ref(localTransformationMatrix) as Ref<TransformationMatrix>) // then append the local transformation matrix
        this._transformationMatrix = computed(() => { return foldl<Ref<TransformationMatrix>, TransformationMatrix>((x, result) => result.multiply(x.value), new TransformationMatrix(), this.transformations) })

        CtxArtist.allCtxArtists.push(this)
        this.canvasId = canvasId
    }

    get transformationMatrix(): TransformationMatrix {
        return this._transformationMatrix.value
    }

    get localTransformationMatrix(): TransformationMatrix {
        return this.transformations[this.transformations.length - 1].value
    }

    getAnchorPoint(name: string): Point {
        if (this.anchorPoints[name] == undefined) {
            console.log("Cannot find anchor point", name, "on CtxArtist")
        }
        return CtxArtist.circuitTransformationMatrix.inverse().multiply(this.transformationMatrix).transformPoint(this.anchorPoints[name])
    }

    getAnchorPointWithTransformations(name: string): [Ref<TransformationMatrix>[], Point] {
        return [this.transformations.slice(0, -1), this.getAnchorPoint(name)]
    }

    moveTo(destination: Point) {
        this.transformations[this.transformations.length - 1].value.translation = destination
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
