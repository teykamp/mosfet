import { Visibility, SchematicEffect, Line, Point, Circle } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { AngleSlider } from "./angleSlider"
import { Ref } from 'vue'
import { unit, Unit } from "mathjs"
import { ekvNmos, ekvPmos } from "../functions/ekvModel"
import { between, toRadians } from "../functions/extraMath"
import { toSiPrefix } from "../functions/toSiPrefix"
import { drawCirclesFillSolid, drawLinesFillSolid, drawLinesFillWithGradient, makeStandardGradient, drawCurrentDots } from "../functions/drawFuncs"
import { interpolateInferno } from "d3"
import { Node } from "./node"

export class Mosfet extends CtxArtist{
    mosfetType: 'nmos' | 'pmos'
    mirror: boolean // obsolete
    dotPercentage: number
    gradientSize: number
    schematicEffects: {[name: string]: SchematicEffect}
    vgs: AngleSlider
    vds: AngleSlider
    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    current: number // in Amps
    saturationLevel: number // as a fraction of total saturation (0 to 1)
    forwardCurrent: number // in Amps

    constructor(parentTransformationMatrix: TransformationMatrix, mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, mirror: boolean = false, vgsVisibility: Visibility = Visibility.Visible, vdsVisibility: Visibility = Visibility.Visible) {
        super(parentTransformationMatrix.translate({x: originX, y: originY}).scale(1/30).mirror(mirror, false))
        this.mosfetType = mosfetType
        this.mirror = mirror
        this.gradientSize = 100
        this.schematicEffects = {
            "gate": {
                node: Vg,
                origin: {
                x: 30,
                y: 0,
                },
                color: 'red',
                gradientSize: 2,
            },
            "saturation": {
                node: Vd,
                origin: {
                x: 0,
                y: 30 * (mosfetType == 'nmos' ? -1 : 1),
                },
                color: 'red',
                gradientSize: 100,
            },
        },
        this.dotPercentage = 0
        this.Vg = Vg
        this.Vs = Vs
        this.Vd = Vd
        this.Vb = Vb
        this.current = this.getMosfetCurrent()
        this.saturationLevel = this.getMosfetSaturationLevel()
        this.forwardCurrent = this.getMosfetForwardCurrent()

        if (this.mosfetType == 'nmos') {
            this.vgs = new AngleSlider(this.transformationMatrix, 10, 10, 60, toRadians(75), toRadians(70), true, 0, maxVgs, 'Vgs', vgsVisibility)
            this.vds = new AngleSlider(this.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, 0, maxVds, 'Vds', vdsVisibility)
        }
        else {
            this.vgs = new AngleSlider(this.transformationMatrix, 10, -10, 60, toRadians(-5), toRadians(70), true, -maxVgs, 0, 'Vsg', vgsVisibility, true)
            this.vds = new AngleSlider(this.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, -maxVds, 0, 'Vsd', vdsVisibility, true)
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)

        const bodyLines: Line[] = [
            {start: {x: 0, y: 20}, end: {x: 0, y: 59}},
            {start: {x: 0, y: 20}, end: {x: 26, y: 20}},
            {start: {x: 0, y: -20}, end: {x: 0, y: -59}},
            {start: {x: 0, y: -20}, end: {x: 26, y: -20}},
            {start: {x: 26, y: -40}, end: {x: 26, y: 40}},
        ]

        const gateLines: Line[] = this.mosfetType == 'nmos' ? [
            {start: {x: 40, y: 30}, end: {x: 40, y: -30}},
            {start: {x: 40, y: 0}, end: {x: 60, y: 0}},
        ] :
        [
            {start: {x: 40, y: 30}, end: {x: 40, y: -30}},
            {start: {x: 50, y: 0}, end: {x: 60, y: 0}},
        ]

        const gateCircles: Circle[] = this.mosfetType == 'nmos' ? [] :
        [{center: {x: 45, y: 0}, outerDiameter: 10}]

        this.gradientSize = this.getGradientSizeFromSaturationLevel()
        const gradientOrigin: Point = {x: 0, y: -60 * (this.mosfetType == 'nmos' ? 1 : -1)}
        const gradient = makeStandardGradient(ctx, gradientOrigin, this.gradientSize, 'rgba(200, 200, 200, 1')

        const forwardCurrentScaled = this.getForwardCurrentScaled()
        const gateColor = this.getGateColorFromForwardCurrent()

        drawLinesFillSolid(ctx, bodyLines, this.localLineThickness, 'black')
        drawLinesFillSolid(ctx, gateLines, this.localLineThickness, gateColor)
        drawCirclesFillSolid(ctx, gateCircles, this.localLineThickness, gateColor)
        drawLinesFillWithGradient(ctx, bodyLines, this.localLineThickness, gradient)

        this.schematicEffects["saturation"].gradientSize = this.gradientSize / 30 * 3.5
        this.schematicEffects["saturation"].color = 'rgba(200, 200, 200, 1)'
        this.schematicEffects["gate"].gradientSize = forwardCurrentScaled * 3.5
        this.schematicEffects["gate"].color = gateColor

        const dotPath: Line[] = [{
            start: {x: -15, y: -60},
            end: {x: -15, y: 60},
        }]
        drawCurrentDots(ctx, dotPath, this.dotPercentage, 8, 20, 60)

        // display current read-out, separating quantity and unit on separate lines
        const currentToDisplay = toSiPrefix(this.current, "A")
        let currentMantissa = ""
        for (const char of currentToDisplay) {
            if ("-0123456789.".indexOf(char) > -1)
                currentMantissa += char
        }
        const currentSuffix = currentToDisplay.slice(currentMantissa.length)

        ctx.fillStyle = 'black'
        ctx.font = "14px sans-serif";
        const nextLineLocation = this.fillTextGlobalReferenceFrame(ctx, {x: 20, y: -3}, currentMantissa, true, true, 14)
        ctx.font = "14px sans-serif";
        this.fillTextGlobalReferenceFrame(ctx, nextLineLocation, currentSuffix, true, true)

        // draw mosfet angle sliders
        this.vgs.draw(ctx)
        this.vds.draw(ctx)
    }


    getMosfetEkvResult(): { I: Unit, saturationLevel: number, IF: Unit } {
        if (this.mosfetType == 'pmos') {
            return ekvPmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V'))
        }
        else {
            return ekvNmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V'))
        }
    }

    getMosfetCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.I.toNumber('A')
    }

    getMosfetSaturationLevel(): number {
        const result = this.getMosfetEkvResult()
        return result.saturationLevel
    }

    getMosfetForwardCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.IF.toNumber('A')
    }

    getGradientSizeFromSaturationLevel(): number {
        const maxGradientSize = this.getRelativeScaling() * 60
        // 100 % saturation -> 0   % maxGradientSize
        // 50  % saturation -> 50  % maxGradientSize
        // 0   % saturation -> 100 % maxGradientSize
        return maxGradientSize * (1 - this.saturationLevel)
    }

    getForwardCurrentScaled(): number {
        // 50 mA -> colorScale of 1
        // 5 mA -> colorScale of 1
        // 500 uA -> colorScale of 0.8
        // 50 uA -> colorScale of 0.6
        // 5 uA -> colorScale of 0.4
        // 500 nA -> colorScale of 0.2
        // 50 nA -> colorScale of 0
        // 5 nA -> colorScale of 0
        // 500 pA -> colorScale of 0
        // 50 pA -> colorScale of 0
        // 5 pA -> colorScale of 0
        return between(0, 1, Math.log10(this.forwardCurrent / 5e-3) * 0.2 + 1)
    }

    getGateColorFromForwardCurrent(): string {
        const forwardCurrentScaled = this.getForwardCurrentScaled()
        return interpolateInferno(forwardCurrentScaled)
    }
}
