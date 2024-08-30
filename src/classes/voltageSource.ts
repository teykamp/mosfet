import { Circle, Line, Point, SchematicEffect, Visibility } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { toRadians } from "../functions/extraMath"
import { Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { drawCirclesFillSolid, drawLinesFillSolid } from "../functions/drawFuncs"

export class VoltageSource extends CtxArtist{
    voltageDrop: AngleSlider
    vplus: Ref<Node>
    vminus: Ref<Node>
    schematicEffects: {[name: string]: SchematicEffect}
    current: number // in Amps
    fixedAt: 'gnd' | 'vdd'

    constructor(parentTransformationMatrix: TransformationMatrix, origin: Point, vminus: Ref<Node>, vplus: Ref<Node>, name: string, fixedAt: 'gnd' | 'vdd', mirror: boolean = false) {
        super(parentTransformationMatrix.translate(origin).mirror(mirror, false))
        this.vplus = vplus,
        this.vminus = vminus,
        this.fixedAt = fixedAt,
        this.voltageDrop = new AngleSlider(this.transformationMatrix, 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, Visibility.Visible)
        this.schematicEffects = {},
        this.current = 0 // Amps
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)

        const radius = 30
        const symbolSize = 11
        const symbolHeight = 10
        ctx.strokeStyle = 'black'
        ctx.lineWidth = this.localLineThickness

        const majorLines: Line[] = [
            {start: {x: 0, y: radius}, end: {x: 0, y: 60}},
            {start: {x: 0, y: -radius}, end: {x: 0, y: -60}},
        ]
        const minorLines: Line[] = [
            {start: {x: symbolSize / 2, y: -symbolHeight}, end: {x: -symbolSize / 2, y: -symbolHeight}},
            {start: {x: 0, y: -symbolHeight - symbolSize / 2}, end: {x: 0, y: -symbolHeight + symbolSize / 2}},
            {start: {x: symbolSize / 2, y: symbolHeight}, end: {x: -symbolSize / 2, y: symbolHeight}},
        ]
        const circles: Circle[] = [
            {center: {x: 0, y: 0}, outerDiameter: 2 * radius},
        ]
        drawLinesFillSolid(ctx, majorLines, this.localLineThickness, 'black')
        drawLinesFillSolid(ctx, minorLines, this.localLineThickness * 0.8, 'black')
        drawCirclesFillSolid(ctx, circles, this.localLineThickness, 'black')

        this.voltageDrop.draw(ctx)
    }
}
