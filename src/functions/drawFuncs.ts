import { Point, Line, Circle } from '../types'
import { lineDrawRepetitions } from '../constants'
import { between } from './extraMath'

export const getLineLength = (line: Line): number => {
    return Math.sqrt((line.end.x - line.start.x) ** 2 + (line.end.y - line.start.y) ** 2)
}

export const getPathLength = (pathLines: Line[]): number => {
    let pathLength = 0
    pathLines.forEach((line: Line) => {
        pathLength += getLineLength(line)
    })
    return pathLength
}

export const getPointAlongLine = (line: Line, percentage: number): Point => {
    percentage = between(0, 1, percentage)
    return {
        x: line.start.x + (line.end.x - line.start.x) * percentage,
        y: line.start.y + (line.end.y - line.start.y) * percentage,
    }
}

export const getPointAlongPath = (pathLines: Line[], percentage: number): Point => {
    const pathLength = getPathLength(pathLines)
    const distanceToTravel = percentage * pathLength

    let distanceTravelled = 0
    // count the cumulative line lengths until you reach the desired distance to travel along the path
    for (let line of pathLines) {
        const thisLineLength = getLineLength(line)
        distanceTravelled += thisLineLength
        if (distanceTravelled >= distanceToTravel) {
            const distanceTravelledBeforeThisLine = distanceTravelled - thisLineLength
            const distanceToTravelAlongThisLine = distanceToTravel - distanceTravelledBeforeThisLine
            const percentageToTravelAlongThisLine = distanceToTravelAlongThisLine / thisLineLength
            return getPointAlongLine(line, percentageToTravelAlongThisLine)
        }
    }
    // this should never be triggered
    console.error("Error finding point along path")
    return {x: 0, y: 0}
}

export const drawLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point, thickness: number = 5) => {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2)

    const perpendicularX = (thickness / 2) / length * -deltaY
    const perpendicularY = (thickness / 2) / length * deltaX

    const parallelX = (thickness / 2) / length * deltaX
    const parallelY = (thickness / 2) / length * deltaY

    const corner0: Point = {x: start.x + perpendicularX - parallelX, y: start.y + perpendicularY - parallelY}
    const corner1: Point = {x: start.x - perpendicularX - parallelX, y: start.y - perpendicularY - parallelY}
    const corner2: Point = {x:   end.x - perpendicularX + parallelX, y:   end.y - perpendicularY + parallelY}
    const corner3: Point = {x:   end.x + perpendicularX + parallelX, y:   end.y + perpendicularY + parallelY}

    ctx.moveTo(corner0.x, corner0.y)
    ctx.lineTo(corner1.x, corner1.y)
    ctx.lineTo(corner2.x, corner2.y)
    ctx.lineTo(corner3.x, corner3.y)
}

export const drawCircle = (ctx: CanvasRenderingContext2D, circle: Circle, thickness: number) => {
    const outerDiameter = circle.outerDiameter
    const innerDiameter = outerDiameter - 2 * thickness

    ctx.moveTo(circle.center.x, circle.center.y)
    ctx.arc(circle.center.x, circle.center.y, outerDiameter / 2, 0, 2 * Math.PI, false)
    if (innerDiameter > 0) {
        ctx.arc(circle.center.x, circle.center.y, innerDiameter / 2, 0, 2 * Math.PI, true)
    }
}

export const makeStandardGradient = (ctx: CanvasRenderingContext2D, origin: Point, radius: number, color: string = 'rgba(200, 200, 200, 1)'): CanvasGradient => {
    const gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(0.99, 'rgba(0, 0, 0, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    return gradient
}

export const makeCtxGradientFunc = (ctx: CanvasRenderingContext2D, gradient: CanvasGradient): (() => void) => {
    const ctxGradient = () => {
        ctx.save()
        ctx.clip()
        ctx.fillStyle = gradient
        ctx.fill()
        ctx.resetTransform()
        ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight)
        ctx.restore()
        ctx.beginPath()
    }
    return ctxGradient
}

export const makeCtxFillFunc = (ctx: CanvasRenderingContext2D, color: string = 'black'): (() => void) => {
    const ctxFill = () => {
        ctx.fillStyle = color
        ctx.fill()
        ctx.beginPath()
    }
    return ctxFill
}

export const drawLinesFillWithGradient = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, gradient: CanvasGradient) => {
    const ctxFunc = makeCtxGradientFunc(ctx, gradient)
    for (let i = 0; i < lineDrawRepetitions; i++) {
        drawLinesFillWithFunction(ctx, lines, thickness, ctxFunc)
    }
}

export const drawLinesFillSolid = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, color: string = 'black') => {
    const ctxFunc = makeCtxFillFunc(ctx, color)
    for (let i = 0; i < lineDrawRepetitions; i++) {
        drawLinesFillWithFunction(ctx, lines, thickness, ctxFunc)
    }
}

export const drawLinesFillWithFunction = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, ctxFunc: () => void) => {
    ctx.beginPath()
    lines.forEach((line) => {
        drawLine(ctx, line.start, line.end, thickness)
        ctxFunc()
    })
}

export const drawCirclesFillWithGradient = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, gradient: CanvasGradient) => {
    const ctxFunc = makeCtxGradientFunc(ctx, gradient)
    drawCirclesFillWithFunction(ctx, circles, thickness, ctxFunc)
}

export const drawCirclesFillSolid = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, color: string = 'black') => {
    const ctxFunc = makeCtxFillFunc(ctx, color)
    drawCirclesFillWithFunction(ctx, circles, thickness, ctxFunc)
}

export const drawCirclesFillWithFunction = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, ctxFunc: () => void) => {
    ctx.beginPath()
    circles.forEach((circle: Circle) => {
        drawCircle(ctx, circle, thickness)
    })
    ctxFunc()
}
