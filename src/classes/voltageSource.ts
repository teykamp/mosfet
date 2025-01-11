import { canvasId, Circle, Line, Point, SchematicEffect } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { toRadians } from "../functions/extraMath"
import { ref, Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { drawCirclesFillSolid, drawLinesFillSolid } from "../functions/drawFuncs"
import { Node } from "./node"
import { Device } from "./device"
import { HtmlSlider } from "./ctxSlider"

export class VoltageSource extends Device{
    voltageDrop: AngleSlider
    vplus: Ref<Node>
    vminus: Ref<Node>
    schematicEffects: {[name: string]: SchematicEffect}
    current: number // in Amps
    fixedAt: 'gnd' | 'vdd'
    isDuplicate: boolean = false
    mouseDownInsideSelectionArea = false
    htmlSlider: HtmlSlider

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], origin: Point, vminus: Ref<Node>, vplus: Ref<Node>, name: string, fixedAt: 'gnd' | 'vdd', mirror: boolean = false, canvasId: canvasId = 'main') {
        super(parentTransformations, (new TransformationMatrix()).translate(origin).mirror(mirror, false).scale(1/30), canvasId)
        this.vplus = vplus
        this.vminus = vminus
        this.fixedAt = fixedAt
        if (fixedAt == 'gnd') {
            this.voltageDrop = new AngleSlider(this.transformations, vminus, vplus, 'toNode', 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, 'visible', canvasId)
        } else {
            this.voltageDrop = new AngleSlider(this.transformations.concat([ref((new TransformationMatrix().mirror(false, true))) as Ref<TransformationMatrix>]), vminus, vplus, 'fromNode', 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, 'visible', canvasId)
        }
        this.schematicEffects = {}
        this.current = 0 // Amps
        this.htmlSlider = this.voltageDrop.toHtmlSlider()

        this.anchorPoints = {
            "Vplus": {x: 0, y: -30},
            "Vminus": {x: 0, y: 30},
            "vdd": {x: 0, y: -60},
            "gnd": {x: 0, y: 60},
        }
    }

    get htmlSliders(): HtmlSlider[] {
        return [
            this.htmlSlider,
        ]
    }


    copy(parentTransformation: Ref<TransformationMatrix>, canvasId: canvasId = 'main'): VoltageSource {
        const newVoltageSource = new VoltageSource(
            [parentTransformation].concat(this.transformations.slice(1)),
            {x: 0, y: 0},
            this.vminus,
            this.vplus,
            this.voltageDrop.displayText,
            this.fixedAt,
            (this.fixedAt == 'gnd') == (this.transformationMatrix.isMirrored), // has not been checked; may be wrong logic
            canvasId
        )
        newVoltageSource.transformations[newVoltageSource.transformations.length - 1].value = new TransformationMatrix()
        return newVoltageSource
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)
        this.drawSelectedHalo(ctx)

        const radius = 30
        const symbolSize = 11
        const symbolHeight = 10
        ctx.strokeStyle = 'black'
        ctx.lineWidth = this.localLineThickness

        const majorLines: Line[] = [
            // {start: {x: 0, y: radius}, end: {x: 0, y: 60}},
            // {start: {x: 0, y: -radius}, end: {x: 0, y: -60}},
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
