import { canvasId, Circle, Line, Point, SchematicEffect, Visibility } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { toRadians } from "../functions/extraMath"
import { ref, Ref } from 'vue'
import { AngleSlider } from "./angleSlider"
import { drawCirclesFillSolid, drawLinesFillSolid } from "../functions/drawFuncs"
import { Node } from "./node"
import { Device } from "./device"

export class VoltageSource extends Device{
    voltageDrop: AngleSlider
    vplus: Ref<Node>
    vminus: Ref<Node>
    schematicEffects: {[name: string]: SchematicEffect}
    current: number // in Amps
    fixedAt: 'gnd' | 'vdd'
    isDuplicate: boolean = false
    selectedFocus: Ref<boolean> = ref(false)
    mouseDownInsideSelectionArea = false

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], origin: Point, vminus: Ref<Node>, vplus: Ref<Node>, name: string, fixedAt: 'gnd' | 'vdd', mirror: boolean = false, canvasId: canvasId = 'main') {
        super(parentTransformations, (new TransformationMatrix()).translate(origin).mirror(mirror, false).scale(1/30), canvasId)
        this.vplus = vplus
        this.vminus = vminus
        this.fixedAt = fixedAt
        if (fixedAt == 'gnd') {
            this.voltageDrop = new AngleSlider(this.transformations, vminus, vplus, 'toNode', 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, Visibility.Visible, canvasId)
        } else {
            this.voltageDrop = new AngleSlider(this.transformations.concat([ref((new TransformationMatrix().mirror(false, true))) as Ref<TransformationMatrix>]), vminus, vplus, 'fromNode', 0, 0, 50, toRadians(40), toRadians(80), true, 0, 5, name, Visibility.Visible, canvasId)
        }
        this.schematicEffects = {}
        this.current = 0 // Amps

        this.anchorPoints = {
            "Vplus": {x: 0, y: -30},
            "Vminus": {x: 0, y: 30},
            "vdd": {x: 0, y: -60},
            "gnd": {x: 0, y: 60},
        }
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

    draw(ctx: CanvasRenderingContext2D, transformationMatrix: TransformationMatrix | undefined = undefined) {
        if (transformationMatrix !== undefined) {
            transformationMatrix.transformCanvas(ctx)
        } else {
            this.transformationMatrix.transformCanvas(ctx)
        }

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
