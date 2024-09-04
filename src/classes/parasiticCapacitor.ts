import { Line, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { drawLinesFillSolid } from "../functions/drawFuncs"
import { Schematic } from "./schematic"
import { toSiPrefix } from "../functions/toSiPrefix"
import { Node } from "./node"
import { CurrentDots } from "./currentDots"

export class ParasiticCapacitor extends CtxArtist{
    node: Ref<Node>
    extraNodeLines: Line[]
    currentDots: CurrentDots
    static displayCurrent: boolean = false

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], node: Ref<Node>, center: Point, extraNodeLines: Line[]) {
        super(parentTransformations, (new TransformationMatrix()).translate(center).scale(1/30))
        this.node = node
        this.extraNodeLines = extraNodeLines
        this.currentDots = new CurrentDots([{start: {x: 10, y: -60}, end: {x: 10, y: 60}}])
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.scale(0.5).transformCanvas(ctx)

        const airGapSize = 7
        const capacitorLines: Line[] = [
            {start: {x: 0, y: 50}, end: {x: 0, y: airGapSize}},
            {start: {x: -30, y: airGapSize}, end: {x: 30, y: airGapSize}},
            {start: {x: -30, y: -airGapSize}, end: {x: 30, y: -airGapSize}},
            {start: {x: 0, y: -60}, end: {x: 0, y: -airGapSize}},
        ]
        const extraNodeLines = this.transformationMatrix.transformPath(this.extraNodeLines)

        drawLinesFillSolid(ctx, capacitorLines, this.localLineThickness, 'black')
        drawLinesFillSolid(ctx, extraNodeLines, this.localLineThickness, 'black')
        ctx.clearRect(-30 - this.localLineThickness, -airGapSize + this.localLineThickness / 2, 60 + 2 * this.localLineThickness, 2 * airGapSize - 2 * this.localLineThickness / 2)
        Schematic.drawGnd(ctx, {x: 0, y: 50}, this.localLineThickness, 30)

        this.currentDots.draw(ctx)

        if (ParasiticCapacitor.displayCurrent) {
            ctx.fillStyle = 'black'
            ctx.font = '14px sans-serif'
            this.fillTextGlobalReferenceFrame(ctx, {x: 40, y: 0}, toSiPrefix(this.node.value.netCurrent, 'A'))
        }
    }
}
