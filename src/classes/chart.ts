import { Visibility, Point } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { toSiPrefix } from "../functions/toSiPrefix"
import { getTickLabelList } from '../functions/getTickLabelList'
import { drawLinesFillSolid } from "../functions/drawFuncs"
import { linspace } from "../functions/linspace"
import { ekvNmos, ekvPmos } from "../functions/ekvModel"
import { Node } from "./node"
import { unit } from "mathjs"
import { CtxSlider } from "./ctxSlider"

export class Chart extends CtxSlider{
    points: Point[]
    xAxisLabel: string
    yAxisLabel: string
    xUnit: string
    yUnit: string
    width: number
    height: number
    axesWidth: number
    axesHeight: number
    cornerToCornerGraph: boolean = true
    plottingValues: Point[] = []
    yValue: number = 0

    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    maxVgs: number
    maxVds: number
    mosfetType: 'nmos' | 'pmos'
    chartType: 'Vgs' | 'Vds'

    xScaleType: 'log' | 'linear'
    yScaleType: 'log' | 'linear'

    static paddingL = 40 // 40
    static paddingR = 10 // 40
    static paddingT = 25 // 25
    static paddingB = 30 // 30
    xMin: number = 0
    xMax: number = 0
    yMin: number = 0
    yMax: number = 0
    xTicks: number[] = []
    yTicks: number[] = []
    xScale: number = 0
    yScale: number = 0


    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], mosfetType: 'nmos' | 'pmos', chartType: 'Vgs' | 'Vds', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, xAxisLabel: string = "x Var", yAxisLabel: string = "y Var", xUnit: string = "xUnit", yUnit: string = "yUnit", xScaleType: 'log' | 'linear' = 'linear', yScaleType: 'log' | 'linear' = 'log', width: number = 250, height: number = 200, visibility: Visibility = Visibility.Visible) {
        super(parentTransformations, (new TransformationMatrix()).translate({x: originX + Chart.paddingL, y: originY - Chart.paddingB + height}).mirror(false, true), Vs, chartType == 'Vgs' ? Vg : Vd, 0, chartType == 'Vgs' ? maxVgs : maxVds, visibility)
        this.points = []
        this.xAxisLabel = xAxisLabel
        this.yAxisLabel = yAxisLabel
        this.xUnit = xUnit
        this.yUnit = yUnit
        this.xScaleType = xScaleType
        this.yScaleType = yScaleType

        this.width = width
        this.height = height
        this.axesWidth = width - Chart.paddingL - Chart.paddingR
        this.axesHeight = height - Chart.paddingT - Chart.paddingB

        this.Vg = Vg
        this.Vs = Vs
        this.Vd = Vd
        this.Vb = Vb
        this.maxVgs = maxVgs
        this.maxVds = maxVds
        this.mosfetType = mosfetType
        this.chartType = chartType
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.visibility == Visibility.Hidden) {
            return
        }
        this.transformationMatrix.transformCanvas(ctx)
        const axisLineThickness = this.localLineThickness / 2
        const tickLineThickness = this.localLineThickness / 4

        if (this.chartType == 'Vgs') {
            this.sweepGateVoltages()
        } else {
            this.sweepDrainVoltages()
        }

        this.xTicks = getTickLabelList(this.xMin, this.xMax, this.xScaleType == 'log').filter((val: number) => val >= this.xMin && val <= this.xMax)
        this.yTicks = getTickLabelList(this.yMin, this.yMax, this.yScaleType == 'log').filter((val: number) => val >= this.yMin && val <= this.yMax)

        let xAxisLabelLocation = 0
        if (this.xTicks.length > 2) {
            const xTickNumberToReplace = Math.ceil(this.xTicks.length / 2)
            xAxisLabelLocation = this.xValueToLocation(this.xTicks[xTickNumberToReplace])
            this.xTicks = this.xTicks.slice(0, xTickNumberToReplace).concat(this.xTicks.slice(xTickNumberToReplace + 1))
        } else {
            xAxisLabelLocation = this.xValueToLocation((this.xTicks[0] + this.xTicks[this.xTicks.length - 1]) / 2)
        }

        this.plottingValues = this.points.map((p: Point) => ({
            x: this.xValueToLocation(p.x),
            y: this.yValueToLocation(p.y)
        }))

        ctx.clearRect(-Chart.paddingL, -Chart.paddingB, this.width, this.height)

        // Draw axis
        ctx.strokeStyle = '#000'
        drawLinesFillSolid(ctx, [
            {start: {x: 0, y: 0}, end: {x: this.axesWidth, y: 0}},
            {start: {x: 0, y: 0}, end: {x: 0, y: this.axesHeight}},
        ], axisLineThickness, "black")

        // Draw axis labels
        ctx.font = '18px Arial'
        this.fillTextGlobalReferenceFrame(ctx, {x: xAxisLabelLocation - 10, y: -20}, this.xAxisLabel, true)
        this.fillTextGlobalReferenceFrame(ctx, {x: -30, y: this.axesHeight + 6}, this.yAxisLabel, true, true)

        // Calculate and draw ticks
        ctx.strokeStyle = '#ccc'
        ctx.font = '12px Arial'
        ctx.fillStyle = '#000'
        ctx.textAlign = 'center'

        this.xTicks.forEach((value: number) => {
            const x = this.xValueToLocation(value)
            const displayValue = toSiPrefix(value, this.xUnit)
            drawLinesFillSolid(ctx,
                [{start: {x: x, y: 0}, end: {x: x, y: -5}}],
                tickLineThickness,
                "black"
            )
            this.fillTextGlobalReferenceFrame(ctx, {x: x, y: -18}, displayValue)
        })

        this.yTicks.forEach((value: number) => {
            const y = this.yValueToLocation(value)
            const displayValue = toSiPrefix(value, this.yUnit)
            drawLinesFillSolid(ctx,
                [{start: {x: 0, y: y}, end: {x: -5, y: y}}],
                tickLineThickness,
                "black"
            )
            this.fillTextGlobalReferenceFrame(ctx, {x: -25, y: y - 6}, displayValue)
        })

        // Draw line
        ctx.strokeStyle = '#f00'
        ctx.lineWidth = axisLineThickness
        ctx.beginPath()
        this.plottingValues.forEach((point: Point, index: number) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y)
            } else {
                ctx.lineTo(point.x, point.y)
            }
        })
        ctx.stroke()

        // Draw draggable circle
        ctx.lineWidth = tickLineThickness
        this.updateLocationBasedOnValue()
        ctx.beginPath()
        ctx.arc(this.location.x, this.location.y, 5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.moveTo(this.location.x, 0)
        ctx.lineTo(this.location.x, this.location.y)
        ctx.stroke()
        const displayText = toSiPrefix(this.yValue, this.yUnit)
        const textWidth = displayText.length * 5
        this.fillTextGlobalReferenceFrame(ctx, {x: this.location.x < this.axesWidth - textWidth ? Math.max(5, this.location.x + textWidth) : this.location.x - textWidth, y: Math.max(5, this.location.y - 15)}, displayText)
    }

    sweepGateVoltages(nPoints: number = this.width / 2) {
        const gateVoltages = linspace(this.Vs.value.voltage, this.maxVgs, nPoints)
        this.points = []
        this.xMin = this.Vs.value.voltage
        this.xMax = this.maxVgs
        this.yMin = Infinity
        this.yMax = -Infinity
        let nextPoint = {x: 0, y: 0}
        gateVoltages.forEach((gateVoltage: number) => {
            if (this.mosfetType == 'nmos') {
                nextPoint = ({x: gateVoltage, y: ekvNmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")})
            } else {
                nextPoint = ({x: gateVoltage, y: ekvPmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")})
            }
            this.yMin = Math.min(this.yMin, nextPoint.y)
            this.yMax = Math.max(this.yMax, nextPoint.y)
            this.points.push(nextPoint)
        })
    }

    sweepDrainVoltages(nPoints: number = this.width / 2) {
        const drainVoltages = linspace(this.Vs.value.voltage, this.maxVds, nPoints)
        this.points = []
        this.xMin = this.Vs.value.voltage
        this.xMax = this.maxVds
        this.yMin = Infinity
        this.yMax = -Infinity
        let nextPoint = {x: 0, y: 0}
        drainVoltages.forEach((drainVoltage: number) => {
            if (this.mosfetType == 'nmos') {
                nextPoint = ({x: drainVoltage, y: ekvNmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(drainVoltage, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100})
            } else {
                nextPoint = ({x: drainVoltage, y: ekvPmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(drainVoltage, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100})
            }
            this.yMin = Math.min(this.yMin, nextPoint.y)
            this.yMax = Math.max(this.yMax, nextPoint.y)
            this.points.push(nextPoint)
        })
    }

    xLocationToValue(xLocation: number): number {
        if (this.xScaleType == 'linear') {
            return xLocation / this.axesWidth * (this.temporaryMaxValue - this.temporaryMinValue)
        } // else
        return 10 ** (Math.log10(xLocation) / this.axesWidth * (this.temporaryMaxValue - this.temporaryMinValue))
    }

    xValueToLocation(xValue: number): number {
        if (this.xScaleType == 'linear') {
            return xValue / (this.temporaryMaxValue - this.temporaryMinValue) * this.axesWidth
        } // else
        return Math.log10(xValue) / (this.temporaryMaxValue - this.temporaryMinValue) * this.axesWidth
    }

    yValueToLocation(yValue: number): number {
        if (this.yScaleType == 'linear') {
            return yValue / (this.yMax - this.yMin) * this.axesHeight
        } // else
        return (Math.log10(yValue) - Math.log10(this.yMin)) / (Math.log10(this.yMax) - Math.log10(this.yMin)) * this.axesHeight
    }

    toggleYAxisLog() {
        // this.xScaleType = this.xScaleType === 'log' ? 'linear' : 'log'
        this.yScaleType = this.yScaleType === 'log' ? 'linear' : 'log'
    }

    updateLocationBasedOnValue() {
        if (this.chartType == 'Vgs') {
            if (this.mosfetType == 'nmos') {
                this.yValue = ekvNmos(unit(this.value, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")
            } else {
                this.yValue = ekvPmos(unit(this.value, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")
            }
        } else {
            if (this.mosfetType == 'nmos') {
                this.yValue = ekvNmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.value, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100
            } else {
                this.yValue = ekvPmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.value, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100
            }
        }
        this.location = {x: this.xValueToLocation(this.value), y: this.yValueToLocation(this.yValue)}
    }

    updateValueBasedOnMousePosition(localMousePosition: Point) {
        this.value = this.xLocationToValue(localMousePosition.x)
    }

    mouseDownIntiatesDrag(localMousePosition: Point): Boolean {
        return (localMousePosition.x > 0) && (localMousePosition.x < this.axesWidth) && (localMousePosition.y > 0) && (localMousePosition.y < this.axesHeight)
    }

}

