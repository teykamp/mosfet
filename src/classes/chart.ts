import { Visibility, Point } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { Ref } from 'vue'
import { toSiPrefix } from "../functions/toSiPrefix"
import { getTickLabelList, getTickLabelListLog } from '../functions/getTickLabelList'
import { drawLinesFillSolid } from "../functions/drawFuncs"
import { linspace } from "../functions/linspace"
import { ekvNmos, ekvPmos } from "../functions/ekvModel"
import { Node } from "./node"
import { unit } from "mathjs"

export class Chart extends CtxArtist{
    visibility: Visibility
    points: Point[]
    xAxisLabel: string
    yAxisLabel: string
    xUnit: string
    yUnit: string
    width: number
    height: number
    cornerToCornerGraph: boolean = true
    plottingValues: Point[] = []

    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    maxVgs: number
    maxVds: number
    mosfetType: 'nmos' | 'pmos'

    xScaleType: 'log' | 'linear' = 'linear'
    yScaleType: 'log' | 'linear' = 'log'
    dragging: boolean = false
    currentPointIndex: number = 0

    paddingL = 40
    paddingR = 40
    paddingT = 25
    paddingB = 30
    xValues: number[] = []
    yValues: number[] = []
    xMin: number = 0
    xMax: number = 0
    yMin: number = 0
    yMax: number = 0
    xTicks: number[] = []
    yTicks: number[] = []
    xScale: number = 0
    yScale: number = 0


    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, xAxisLabel: string = "x Var", yAxisLabel: string = "y Var", xUnit: string = "xUnit", yUnit: string = "yUnit", width: number = 250, height: number = 200, visibility: Visibility = Visibility.Visible) {
        super(parentTransformations, (new TransformationMatrix()).translate({x: originX, y: originY}).scale(1/30))
        this.visibility = visibility
        this.points = []
        this.xAxisLabel = xAxisLabel
        this.yAxisLabel = yAxisLabel
        this.xUnit = xUnit
        this.yUnit = yUnit
        this.width = width
        this.height = height

        this.Vg = Vg
        this.Vs = Vs
        this.Vd = Vd
        this.Vb = Vb
        this.maxVgs = maxVgs
        this.maxVds = maxVds
        this.mosfetType = mosfetType
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.visibility == Visibility.Hidden) {
            return
        }
        this.transformationMatrix.transformCanvas(ctx)
        const axisLineThickness = this.localLineThickness / 2
        const tickLineThickness = this.localLineThickness / 4

        const nPoints = 100
        const gateVoltages = linspace(0, this.maxVgs, nPoints)
        // const drainVoltages = linspace(0, this.maxVds, nPoints)
        this.points = gateVoltages.map((gateVoltage: number) => {
            if (this.mosfetType == 'nmos') {
                return {x: gateVoltage, y: ekvNmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")}
            } else {
                return {x: gateVoltage, y: ekvPmos(unit(gateVoltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V')).I.toNumber("A")}
            }
        })

        this.plottingValues = this.points.map((p: Point) => ({
            x: this.xScaleType === 'log' ? Math.log10(p.x) : p.x,
            y: this.yScaleType === 'log' ? Math.log10(p.y) : p.y
        })).filter((p: Point) => p.x >= this.xMin && p.x <= this.xMax && p.y >= this.yMin && p.y <= this.yMax)

        this.calculateValues()

        ctx.clearRect(0, 0, this.width, this.height)

        // Draw axis
        ctx.strokeStyle = '#000'
        drawLinesFillSolid(ctx, [
            {start: {x: this.paddingL, y: this.height - this.paddingB}, end: {x: this.width - this.paddingR, y: this.height - this.paddingB}},
            {start: {x: this.paddingL, y: this.height - this.paddingB}, end: {x: this.paddingL, y: this.paddingT}},
        ],
        axisLineThickness, "black")

        // Draw axis labels
        ctx.font = '16px Arial'
        ctx.fillText(this.xAxisLabel, this.width - this.paddingL + 5, this.height - this.paddingB + 18)
        ctx.fillText(this.yAxisLabel, this.paddingL / 2, 20)

        // Calculate and draw ticks
        ctx.strokeStyle = '#ccc'
        ctx.font = '12px Arial'
        ctx.fillStyle = '#000'


        this.xTicks.forEach((value: number) => {
            const x = this.paddingL + (value - this.xMin) * this.xScale
            const displayValue = toSiPrefix(this.xScaleType === 'log' ? (10 ** value) : value, this.xUnit)
            drawLinesFillSolid(ctx,
                [{start: {x: x, y: this.height - this.paddingB}, end: {x: x, y: this.height - this.paddingB + 5}}],
                tickLineThickness,
                "black"
            )
            ctx.fillText(displayValue, x - 10, this.height - this.paddingB + 20)
        })

        this.yTicks.forEach((value: number) => {
            const y = this.height - this.paddingB - (value - this.yMin) * this.yScale
            const displayValue = toSiPrefix(this.yScaleType === 'log' ? (10 ** value) : value, this.yUnit)
            drawLinesFillSolid(ctx,
                [{start: {x: this.paddingL, y: y}, end: {x: this.paddingL - 5, y: y}}],
                tickLineThickness,
                "black"
            )
            ctx.fillText(displayValue, this.paddingL - 35, y + 5, 30) // last parameter specifies a maximum width of the text
        })

        // Draw line
        ctx.strokeStyle = '#f00'
        ctx.lineWidth = axisLineThickness
        ctx.beginPath()
        this.plottingValues.forEach((point: Point, index: number) => {
            const x = this.paddingL + (point.x - this.xMin) * this.xScale
            const y = this.height - this.paddingB - (point.y - this.yMin) * this.yScale
            if (index === 0) {
            ctx.moveTo(x, y)
            } else {
            ctx.lineTo(x, y)
            }
        })
        ctx.stroke()

        // Draw draggable circle
        const dragPoint = this.plottingValues[this.currentPointIndex]
        if (dragPoint) {
            const dragX = this.paddingL + (dragPoint.x - this.xMin) * this.xScale
            const dragY = this.height - this.paddingB - (dragPoint.y - this.yMin) * this.yScale
            ctx.beginPath()
            ctx.arc(dragX, dragY, 5, 0, 2 * Math.PI)
            ctx.fill()
            ctx.moveTo(dragX, dragY)
            ctx.lineTo(dragX, this.height - this.paddingB)
            ctx.stroke()
            ctx.fillText(toSiPrefix(this.yScaleType === 'log' ? 10 ** dragPoint.y : dragPoint.y, this.yUnit), dragX, dragY - 10)
        }
    }

    calculateValues() {
        this.xValues = this.points.map((p: Point) => this.xScaleType === 'log' ? Math.log10(p.x) : p.x)
        this.yValues = this.points.map((p: Point) => this.yScaleType === 'log' ? Math.log10(p.y) : p.y)

        this.xTicks = this.xScaleType === 'log' ? getTickLabelListLog(Math.min(...this.points.map((p: Point) => p.x)), Math.max(...this.points.map((p: Point) => p.x))).map(Math.log10) : getTickLabelList(Math.min(...this.points.map((p: Point) => p.x)), Math.max(...this.points.map((p: Point) => p.x)))
        this.yTicks = this.yScaleType === 'log' ? getTickLabelListLog(Math.min(...this.points.map((p: Point) => p.y)), Math.max(...this.points.map((p: Point) => p.y))).map(Math.log10) : getTickLabelList(Math.min(...this.points.map((p: Point) => p.y)), Math.max(...this.points.map((p: Point) => p.y)))

        this.xMin = this.cornerToCornerGraph ? Math.min(...this.xValues) : Math.min(...this.xTicks)
        this.xMax = this.cornerToCornerGraph ? Math.max(...this.xValues) : Math.max(...this.xTicks)
        this.yMin = this.cornerToCornerGraph ? Math.min(...this.yValues) : Math.min(...this.yTicks)
        this.yMax = this.cornerToCornerGraph ? Math.max(...this.yValues) : Math.max(...this.yTicks)

        if (this.cornerToCornerGraph) {
            const margin = 0
            this.xTicks = this.xTicks.filter((x) => (this.xMin - Math.abs(this.xMin) * margin <= x) && (x <= this.xMax + Math.abs(this.xMax) * margin))
            this.yTicks = this.yTicks.filter((y) => (this.yMin - Math.abs(this.yMin) * margin <= y) && (y <= this.yMax + Math.abs(this.yMax) * margin))
        }

        this.xScale = (this.width - this.paddingL - this.paddingR) / (this.xMax - this.xMin)
        this.yScale = (this.height - this.paddingT - this.paddingB) / (this.yMax - this.yMin)
    }

    toggleYAxisLog() {
        // this.xScaleType = this.xScaleType === 'log' ? 'linear' : 'log'
        this.yScaleType = this.yScaleType === 'log' ? 'linear' : 'log'
    }

    getClosestPointIndex(mouseX: number) {
        let closestIndex = 0
        let closestDistance = Infinity

        this.plottingValues.forEach((point: Point, index: number) => {
            const pointX = this.paddingL + (point.x - this.xMin) * this.xScale
            const distance = Math.abs(pointX - mouseX)
            if (distance < closestDistance) {
                closestDistance = distance
                closestIndex = index
            }
        })

        return closestIndex
    }
}

