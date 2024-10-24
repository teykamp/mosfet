import { Visibility, Point } from "../types"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { toSiPrefix } from "../functions/toSiPrefix"
import { getTickLabelList } from '../functions/getTickLabelList'
import { drawLinesFillSolid } from "../functions/drawFuncs"
import { linspace } from "../functions/linspace"
import { ekvNmos, ekvNmosNoUnits, ekvPmos, ekvPmosNoUnits } from "../functions/ekvModel"
import { Node } from "./node"
import { unit } from "mathjs"
import { CtxSlider } from "./ctxSlider"
import { drawGrid } from "../constants"
import { LRUCache } from 'lru-cache'

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
    pointsCache: LRUCache<string, Point[]> = new LRUCache({max: 1000})
    cacheAttempts: number = 0
    cacheHits: number = 0

    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    mosfetType: 'nmos' | 'pmos'
    chartType: 'Vgs' | 'Vds'
    originalMaxValue: number

    xScaleType: 'log' | 'linear'
    yScaleType: 'log' | 'linear'

    static paddingL = 40 // 40
    static paddingR = 10 // 40
    static paddingT = 20 // 25
    static paddingB = 30 // 30
    yMin: number = 0
    yMax: number = 0
    xTicks: number[] = []
    yTicks: number[] = []
    xScale: number = 0
    yScale: number = 0


    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], mosfetType: 'nmos' | 'pmos', chartType: 'Vgs' | 'Vds', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, gnd: Ref<Node>, maxValue: number = 5, xAxisLabel: string = "x Var", yAxisLabel: string = "y Var", xUnit: string = "xUnit", yUnit: string = "yUnit", xScaleType: 'log' | 'linear' = 'linear', yScaleType: 'log' | 'linear' = 'log', width: number = 250, height: number = 200, visibility: Visibility = Visibility.Visible) {
        const fromNode = gnd
        const toNode = chartType == 'Vgs' ? Vg : Vd
        const drivenNode: 'fromNode' | 'toNode' = 'toNode'

        super(parentTransformations, (new TransformationMatrix()).translate({x: originX, y: originY}), fromNode, toNode, drivenNode, 0, maxValue, visibility)
        if (this.transformationMatrix.isMirrored) {
            this.transformations[this.transformations.length - 1].value.mirror(true, false, true)
        }
        this.transformations[this.transformations.length - 1].value.rotate(-this.transformationMatrix.rotation, true)
        this.transformations[this.transformations.length - 1].value.mirror(false, true, true)
        if (chartType == 'Vgs') {
            this.transformations[this.transformations.length - 1].value.translate({x: -width / 2, y: 0}, true)
        } else {
            this.transformations[this.transformations.length - 1].value.translate({x: -width / 2, y: -height}, true)
        }
        this.transformations[this.transformations.length - 1].value.translate({x: Chart.paddingL, y: Chart.paddingB}, true)

        this.points = []
        this.xAxisLabel = xAxisLabel // "←" + xAxisLabel + "→"
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
        this.mosfetType = mosfetType
        this.chartType = chartType
        this.originalMaxValue = maxValue
        this.temporaryMinValue = this.minValue
        this.temporaryMaxValue = this.maxValue
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

        if (this.preciseDragging) {
            this.xTicks = getTickLabelList(this.temporaryMinValue, this.temporaryMaxValue, this.xScaleType == 'log').filter((val: number) => val >= this.temporaryMinValue && val <= this.temporaryMaxValue)
        } else {
            this.xTicks = [0, 1, 2, 3, 4, 5]
        }

        if (this.chartType == 'Vgs') {
            this.yTicks = [1e-3, 1e-6, 1e-9, 1e-12].filter((val: number) => val >= this.yMin && val <= this.yMax)
        } else {
            this.yTicks = [25, 50, 75, 100].filter((val: number) => val >= this.yMin && val <= this.yMax)
        }

        const xAxisLabelLocation = this.xValueToLocation(this.value)
        const xAxisLabelRange = (this.temporaryMaxValue - this.temporaryMinValue) / 4
        this.xTicks = this.xTicks.filter((xTick: number) => {
            return !((this.value - xAxisLabelRange / 2 < xTick) && (xTick < this.value + xAxisLabelRange / 2))
        })

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
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        let nextLine = this.fillTextGlobalReferenceFrame(ctx, {x: xAxisLabelLocation, y: -16}, this.xAxisLabel, false)
        ctx.font = '12px Arial'
        this.fillTextGlobalReferenceFrame(ctx, {x: nextLine.x, y: nextLine.y + 3}, toSiPrefix(this.value, 'V'), false)
        ctx.font = '18px Arial'
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

        // draw borders
        if (drawGrid) {
            ctx.lineWidth = 5
            ctx.strokeStyle = "black"
            ctx.strokeRect(-Chart.paddingL, -Chart.paddingB, this.width, this.height)
        }
    }

    sweepGateVoltages(nPoints: number = this.width / 3) {
        this.yMin = Infinity
        this.yMax = -Infinity

        const fullRangeGateVoltages = linspace(this.minValue, this.maxValue, 5)
        fullRangeGateVoltages.forEach((gateVoltage: number) => {
            const yVal = this.getMosfetCurrentFromGateVoltage(gateVoltage)
            this.yMin = Math.min(this.yMin, yVal)
            this.yMax = Math.max(this.yMax, yVal)
        })

        this.cacheAttempts += 1
        console.log("cache hit ratio: ", (this.cacheHits / this.cacheAttempts).toFixed(5))
        const cacheValue = this.pointsCache.get(this.discretizeArgsForCache(this.temporaryMinValue, this.temporaryMaxValue, this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage))
        if (cacheValue !== undefined) {
            this.points = cacheValue
            this.cacheHits += 1
            return
        } // else

        this.points = []
        let nextPoint = {x: 0, y: 0}
        const gateVoltages = linspace(this.temporaryMinValue, this.temporaryMaxValue, nPoints)
        gateVoltages.forEach((gateVoltage: number) => {
            nextPoint = {x: gateVoltage, y: this.getMosfetCurrentFromGateVoltage(gateVoltage)}
            this.points.push(nextPoint)
        })
        this.pointsCache.set(this.discretizeArgsForCache(this.temporaryMinValue, this.temporaryMaxValue, this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage), this.points)
    }

    sweepDrainVoltages(nPoints: number = this.width / 3) {
        this.points = []
        this.yMin = Infinity
        this.yMax = -Infinity

        const fullRangeDrainVoltages = linspace(this.minValue, this.maxValue, 5)
        fullRangeDrainVoltages.forEach((drainVoltage: number) => {
            let yVal = this.getMosfetSaturationFromDrainVoltage(drainVoltage)
            if (yVal < 0) {
                yVal = 0
            }
            // this.yMin = Math.min(this.yMin, yVal)
            this.yMax = Math.max(this.yMax, yVal)
        })
        this.yMin = 0


        this.cacheAttempts += 1
        console.log("cache hit ratio: ", (this.cacheHits / this.cacheAttempts).toFixed(5))
        const cacheValue = this.pointsCache.get(this.discretizeArgsForCache(this.temporaryMinValue, this.temporaryMaxValue, this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage))
        if (cacheValue !== undefined) {
            this.points = cacheValue
            this.cacheHits += 1
            return
        } // else

        const drainVoltages = linspace(this.temporaryMinValue, this.temporaryMaxValue, nPoints)
        let nextPoint = {x: 0, y: 0}
        drainVoltages.forEach((drainVoltage: number) => {
            nextPoint = {x: drainVoltage, y: this.getMosfetSaturationFromDrainVoltage(drainVoltage)}
            if (nextPoint.y < 0) {
                nextPoint.y = 0
            }
            this.points.push(nextPoint)
        })

        this.pointsCache.set(this.discretizeArgsForCache(this.temporaryMinValue, this.temporaryMaxValue, this.Vg.value.voltage, this.Vs.value.voltage, this.Vd.value.voltage), this.points)
    }

    discretizeArgsForCache(Vmin: number, Vmax: number, V1: number, V2: number, V3: number): string {
        const nDecimals = 2
        return JSON.stringify([Vmin.toFixed(nDecimals), Vmax.toFixed(nDecimals), V1.toFixed(nDecimals), V2.toFixed(nDecimals), V3.toFixed(nDecimals)])
    }

    xLocationToValue(xLocation: number): number {
        let returnValue = 0
        if (this.xScaleType == 'linear') {
            returnValue = xLocation / this.axesWidth * (this.temporaryMaxValue - this.temporaryMinValue) + this.temporaryMinValue
        } else {
            returnValue = 10 ** (Math.log10(xLocation) / this.axesWidth * (Math.log10(this.temporaryMaxValue) - Math.log10(this.temporaryMinValue)) + Math.log10(this.temporaryMinValue))
        }
        // return (this.mosfetType == 'nmos' ? returnValue : this.Vs.value.voltage - returnValue)
        return returnValue
    }

    xValueToLocation(xValue: number): number {
        if (this.xScaleType == 'linear') {
            return (xValue - this.temporaryMinValue) / (this.temporaryMaxValue - this.temporaryMinValue) * this.axesWidth
        } // else
        return (Math.log10(xValue) - Math.log10(this.temporaryMinValue)) / (Math.log10(this.temporaryMaxValue) - Math.log10(this.temporaryMinValue)) * this.axesWidth
    }

    yValueToLocation(yValue: number): number {
        if (this.yScaleType == 'linear') {
            return (yValue - this.yMin) / (this.yMax - this.yMin) * this.axesHeight
        } // else
        return (Math.log10(yValue) - Math.log10(this.yMin)) / (Math.log10(this.yMax) - Math.log10(this.yMin)) * this.axesHeight
    }

    toggleYAxisLog() {
        // this.xScaleType = this.xScaleType === 'log' ? 'linear' : 'log'
        this.yScaleType = this.yScaleType === 'log' ? 'linear' : 'log'
    }

    updateLocationBasedOnValue() {
        const valueToDraw = this.value

        if (this.chartType == 'Vgs') {
            this.yValue = this.getMosfetCurrentFromGateVoltage(valueToDraw)
        } else {
            this.yValue = this.getMosfetSaturationFromDrainVoltage(valueToDraw)
        }
        this.location = {x: this.xValueToLocation(valueToDraw), y: this.yValueToLocation(this.yValue)}
    }

    getMosfetCurrentFromGateVoltage(gateVoltage: number) {
        if (this.mosfetType == 'nmos') {
            return ekvNmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")
        } else {
            return ekvPmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")
        }
    }

    getMosfetSaturationFromDrainVoltage(drainVoltage: number) {
        // if (this.mosfetType == 'nmos') {
        //     return ekvNmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(drainVoltage, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100
        // } else {
        //     return ekvPmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(drainVoltage, 'V'), unit(this.Vb.value.voltage, 'V')).saturationLevel * 100
        // }
        if (this.mosfetType == 'nmos') {
            return ekvNmosNoUnits(this.Vg.value.voltage, this.Vs.value.voltage, drainVoltage, this.Vb.value.voltage).saturationLevel * 100
        } else {
            return ekvPmosNoUnits(this.Vg.value.voltage, this.Vs.value.voltage, drainVoltage, this.Vb.value.voltage).saturationLevel * 100
        }
}

    updateValueBasedOnMousePosition(localMousePosition: Point) {
        this.value = this.xLocationToValue(localMousePosition.x)
    }

    mouseDownIntiatesDrag(localMousePosition: Point): Boolean {
        return (localMousePosition.x > 0) && (localMousePosition.x < this.axesWidth) && (localMousePosition.y > 0) && (localMousePosition.y < this.axesHeight)
    }
}

