import { Visibility, SchematicEffect, Line, Point, Circle, canvasId } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { AngleSlider } from "./angleSlider"
import { ref, Ref } from 'vue'
import { ekvNmosNoUnits, ekvPmosNoUnits } from "../functions/ekvModel"
import { between, toRadians } from "../functions/extraMath"
import { toSiPrefix } from "../functions/toSiPrefix"
import { drawCirclesFillSolid, drawLinesFillSolid, drawLinesFillWithGradient, makeStandardGradient } from "../functions/drawFuncs"
import { interpolateInferno } from "d3"
import { Node } from "./node"
import { CurrentDots } from "./currentDots"
import { TectonicPoint } from "./tectonicPlate"
import { Chart } from "./chart"
import { vddVoltage } from "../constants"
import { Device } from "./device"

export class Mosfet extends Device{
    mosfetType: 'nmos' | 'pmos'
    isDuplicate: boolean = false
    // mirror: boolean
    currentDots: CurrentDots
    gradientSize: number = 100
    schematicEffects: {[name: string]: SchematicEffect}
    vgs: AngleSlider
    vds: AngleSlider
    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    gndNode: Ref<Node>
    mouseDownInsideSelectionArea = false
    _selected: Ref<boolean> = ref(false)
    selectedFocus: Ref<boolean> = ref(false)
    vgsChart: Chart
    vdsChart: Chart
    static chartWidth = 200
    static chartHeight = 120
    static chartLocations = {
        "base": {x: -Mosfet.chartWidth / 2 - 100, y: 0},
        "lowerBase": {x: -Mosfet.chartWidth / 2 - 100, y: 100},
        "gate": {x: Mosfet.chartWidth / 2 + 120, y: 0},
        "furtherGate": {x: Mosfet.chartWidth / 2 + 150, y: 0},
        "voltageSource": {x: Mosfet.chartWidth / 2 + 240, y: 0},
        "lowerVoltageSource": {x: Mosfet.chartWidth / 2 + 240, y: 100},
        "mirrorDriver": {x: Mosfet.chartWidth / 2 + 110, y: -this.chartHeight - 20},
        "deviceOrigin": {x: 0, y: 0},
    }

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, gnd: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, mirror: boolean = false, vgsVisibility: Visibility = 'visible', vdsVisibility: Visibility = 'visible', chartLocation: keyof typeof Mosfet.chartLocations = "gate", canvasId: canvasId = 'main') {
        super(parentTransformations, (new TransformationMatrix()).translate({x: originX, y: originY}).scale(1/30).mirror(mirror, mosfetType == 'pmos'), canvasId)

        this.mosfetType = mosfetType
        this.schematicEffects = {
            "gate": {
                node: Vg,
                origin: new TectonicPoint(this.transformations, {
                    x: 60,
                    y: 0,
                }),
                color: 'red',
                gradientSize: 2,
            },
            "saturation": {
                node: Vd,
                origin: new TectonicPoint(this.transformations, {
                    x: 0,
                    y: -60,
                }),
                color: 'red',
                gradientSize: 100,
            },
        }

        this.Vg = Vg
        this.Vs = Vs
        this.Vd = Vd
        this.Vb = Vb
        this.gndNode = gnd

        this.anchorPoints = {
            "Vg": {x: 60, y: 0},
            "Vs": {x: 0, y: 60},
            "Vd": {x: 0, y: -60},
            "Vb": {x: 0, y: 0},
            "SourceSupply": {x: 0, y: 90},
            "DrainSupply": {x: 0, y: -90},
            "Vg_mirror_gate": {x: 90, y: 0},
            "Vg_mirror_corner": {x: 90, y: -90},
            "Vg_mirror_drain": {x: 0, y: -90},
            "Vg_drive_gate": {x: 120, y: 0},
            "Vg_drive_Vsource": {x: 120, y: 90},
        }

        let chartCanvasId: canvasId = 'main'
        if (canvasId == 'mosfet') {
            chartCanvasId = 'chart'
        }

        // maybe can be condensed down to one case
        if (this.mosfetType == 'nmos') {
            this.vgs = new AngleSlider(this.transformations, Vs, Vg, 'toNode', 10, 10, 60, toRadians(75), toRadians(70), true, 0, maxVgs, 'Vgs', vgsVisibility, canvasId)
            this.vds = new AngleSlider(this.transformations, Vs, Vd, 'toNode', 30, 0, 75, toRadians(140), toRadians(80), false, 0, maxVds, 'Vds', vdsVisibility, canvasId)
            this.vgsChart = new Chart(this.transformations, mosfetType, 'Vgs', Mosfet.chartLocations[chartLocation].x, Mosfet.chartLocations[chartLocation].y, Vg, Vs, Vd, Vb, gnd, 5, "Vg", "Current", "V", "A", 'linear', 'log', 200, 115, 'hidden', chartCanvasId)
            this.vdsChart = new Chart(this.transformations, mosfetType, 'Vds', Mosfet.chartLocations[chartLocation].x, Mosfet.chartLocations[chartLocation].y, Vg, Vs, Vd, Vb, gnd, 5, "Vd", "Saturation Level", "V", "%", 'linear', 'linear', 200, 115, 'hidden', chartCanvasId)
            this.currentDots = new CurrentDots([{start: {x: -15, y: -60}, end: {x: -15, y: 60}}])
        }
        else {
            this.vgs = new AngleSlider(this.transformations, Vg, Vs, 'fromNode', 10, 10, 60, toRadians(75), toRadians(70), true, 0, maxVgs, 'Vsg', vgsVisibility, canvasId)
            this.vds = new AngleSlider(this.transformations, Vd, Vs, 'fromNode', 30, 0, 75, toRadians(140), toRadians(80), false, 0, maxVds, 'Vsd', vdsVisibility, canvasId)
            this.vgsChart = new Chart(this.transformations, mosfetType, 'Vgs', Mosfet.chartLocations[chartLocation].x, Mosfet.chartLocations[chartLocation].y, Vg, Vs, Vd, Vb, gnd, 5, "Vg", "Current", "V", "A", 'linear', 'log', 200, 115, 'hidden', chartCanvasId)
            this.vdsChart = new Chart(this.transformations, mosfetType, 'Vds', Mosfet.chartLocations[chartLocation].x, Mosfet.chartLocations[chartLocation].y, Vg, Vs, Vd, Vb, gnd, 5, "Vd", "Saturation Level", "V", "%", 'linear', 'linear', 200, 115, 'hidden', chartCanvasId)
            this.currentDots = new CurrentDots([{start: {x: -15, y: 60}, end: {x: -15, y: -60}}])
        }
    }

    copy(parentTransformation: Ref<TransformationMatrix>, canvasId: canvasId = 'main'): Mosfet {
        const newMosfet = new Mosfet(
            [parentTransformation].concat(this.transformations.slice(1)),
            this.mosfetType,
            0,
            0,
            this.Vg,
            this.Vs,
            this.Vd,
            this.Vb,
            this.gndNode,
            undefined,
            undefined,
            (this.mosfetType == 'nmos') == (this.transformationMatrix.isMirrored),
            this.vgs.visibility,
            this.vds.visibility,
            "deviceOrigin",
            canvasId
        )
        newMosfet.vgsChart.visibility = 'hidden'
        newMosfet.vdsChart.visibility = 'hidden'
        newMosfet.isDuplicate = true
        newMosfet.transformations[newMosfet.transformations.length - 1].value = new TransformationMatrix()
        return newMosfet
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)
        this.drawSelectedHalo(ctx)

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
        const gradientOrigin: Point = {x: 0, y: -60}
        const gradient = makeStandardGradient(ctx, gradientOrigin, this.gradientSize, 'rgba(200, 200, 200, 1)')

        const forwardCurrentScaled = this.getForwardCurrentScaled()
        const gateColor = this.getGateColorFromForwardCurrent()

        // const lineThickness = this.isDuplicate ? GLOBAL_LINE_THICKNESS : this.localLineThickness
        drawLinesFillSolid(ctx, bodyLines, this.localLineThickness, 'black')
        drawLinesFillSolid(ctx, gateLines, this.localLineThickness, gateColor)
        drawCirclesFillSolid(ctx, gateCircles, this.localLineThickness, gateColor)
        drawLinesFillWithGradient(ctx, bodyLines, this.localLineThickness, gradient)

        this.schematicEffects["saturation"].gradientSize = this.gradientSize / 30 * 3.5
        this.schematicEffects["saturation"].color = 'rgba(200, 200, 200, 1)'
        this.schematicEffects["gate"].gradientSize = forwardCurrentScaled * 3.5
        this.schematicEffects["gate"].color = gateColor

        this.currentDots.draw(ctx)

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
        const nextLineLocation = this.fillTextGlobalReferenceFrame(ctx, {x: 20, y: this.mosfetType == 'nmos' ? -3 : 3}, currentMantissa, true, true, 14)
        ctx.font = "14px sans-serif";
        this.fillTextGlobalReferenceFrame(ctx, nextLineLocation, currentSuffix, true, true)

        // if (this.selected.value && !this.isDuplicate) {
            this.vgsChart.draw(ctx)
            this.vdsChart.draw(ctx)
        // }

        // draw mosfet angle sliders
        this.vgs.draw(ctx)
        this.vds.draw(ctx)
    }

    toggleSelected() {
        if (this.selected.value) {
            this.selected.value = false
            this.vgsChart.visibility = 'hidden'
            this.vdsChart.visibility = 'hidden'
        } else {
            this.selected.value = true
            this.vgsChart.visibility = this.vgs.visibility
            this.vdsChart.visibility = this.vds.visibility
        }
    }

    get current(): number { // in Amps
        return this.getMosfetCurrent()
    }
    get saturationLevel(): number { // as a fraction of total saturation (0 to 1)
        return this.getMosfetSaturationLevel()
    }
    get forwardCurrent(): number { // in Amps
        return this.getMosfetForwardCurrent()
    }

    setMinAndMaxValue() {
        if (this.mosfetType == 'pmos') {
            this.vgs.minValue = this.Vs.value.voltage - vddVoltage
            this.vds.minValue = this.Vs.value.voltage - vddVoltage
            this.vgsChart.minValue = this.Vs.value.voltage - vddVoltage
            this.vdsChart.minValue = this.Vs.value.voltage - vddVoltage
        } else {
            this.vgs.minValue = -this.Vs.value.voltage
            this.vds.minValue = -this.Vs.value.voltage
            this.vgsChart.minValue = -this.Vs.value.voltage
            this.vdsChart.minValue = -this.Vs.value.voltage
        }
    }

    getMosfetEkvResult(): { I: number, saturationLevel: number, IF: number } {
        if (this.mosfetType == 'pmos') {
            return ekvPmosNoUnits(this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage, this.Vb.value.voltage)
        }
        else {
            return ekvNmosNoUnits(this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage, this.Vb.value.voltage)
        }
    }

    getMosfetCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.I
    }

    getMosfetSaturationLevel(): number {
        const result = this.getMosfetEkvResult()
        return result.saturationLevel
    }

    getMosfetForwardCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.IF
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
