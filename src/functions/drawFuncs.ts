import { Point, TransformParameters, Line, Circle } from '../types'
import { makeTransformParameters } from './makeMosfet'
import { canvasSize } from '../constants'
import { Matrix } from 'ts-matrix'

export const applyTransformationMatrix = (ctx: CanvasRenderingContext2D, transformationMatrix: Matrix, resetFirst: boolean = true) => {
    if (resetFirst) {
      ctx.setTransform(transformationMatrix.at(0, 0), transformationMatrix.at(1, 0), transformationMatrix.at(0, 1), transformationMatrix.at(1, 1), transformationMatrix.at(0, 2), transformationMatrix.at(1, 2))
    } else {
      ctx.transform(   transformationMatrix.at(0, 0), transformationMatrix.at(1, 0), transformationMatrix.at(0, 1), transformationMatrix.at(1, 1), transformationMatrix.at(0, 2), transformationMatrix.at(1, 2))
    }
  }


export const transformPoint = (point: Point, parameters: TransformParameters): Point => {
    let x = point.x
    let y = point.y

    // // rotation
    // x = x * Math.cos(parameters.rotation) - y * Math.sin(parameters.rotation)
    // y = x * Math.sin(parameters.rotation) + y * Math.cos(parameters.rotation)
    // // mirror
    // if (parameters.mirror.x) {
    //     x *= -1
    // }
    // if (parameters.mirror.y) {
    //     y *= -1
    // }
    // // scaling
    // x *= parameters.scale.x
    // y *= parameters.scale.y
    // // translation
    // x += parameters.translation.x
    // y += parameters.translation.y

    return {x, y}
}

export const drawLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point, thickness: number = 5, transformParameters: TransformParameters = makeTransformParameters()) => {
    end = transformPoint(end, transformParameters)
    start = transformPoint(start, transformParameters)

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

export const drawCircle = (ctx: CanvasRenderingContext2D, circle: Circle, thickness: number, transformParameters: TransformParameters) => {
    const center = transformPoint(circle.center, transformParameters)
    const outerDiameter = circle.outerDiameter * transformParameters.scale.x
    const innerDiameter = outerDiameter - 2 * thickness

    ctx.moveTo(center.x, center.y)
    ctx.arc(center.x, center.y, outerDiameter / 2, 0, 2 * Math.PI, false)
    if (innerDiameter > 0) {
        ctx.arc(center.x, center.y, innerDiameter / 2, 0, 2 * Math.PI, true)
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
        ctx.fillRect(0, 0, canvasSize.x, canvasSize.y)
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

export const drawLinesFillWithGradient = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, gradient: CanvasGradient, transformParameters: TransformParameters = makeTransformParameters()) => {
    const ctxFunc = makeCtxGradientFunc(ctx, gradient)
    drawLinesFillWithFunction(ctx, lines, thickness, ctxFunc, transformParameters)
}

export const drawLinesFillSolid = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, color: string = 'black', transformParameters: TransformParameters = makeTransformParameters()) => {
    const ctxFunc = makeCtxFillFunc(ctx, color)
    drawLinesFillWithFunction(ctx, lines, thickness, ctxFunc, transformParameters)
}

export const drawLinesFillWithFunction = (ctx: CanvasRenderingContext2D, lines: Line[], thickness: number = 5, ctxFunc: () => void, transformParameters: TransformParameters = makeTransformParameters()) => {
    ctx.beginPath()
    lines.forEach((line) => {
        drawLine(ctx, line.start, line.end, thickness, transformParameters)
        ctxFunc()
    })
}

export const drawCirclesFillWithGradient = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, gradient: CanvasGradient, transformParameters: TransformParameters = makeTransformParameters()) => {
    const ctxFunc = makeCtxGradientFunc(ctx, gradient)
    drawCirclesFillWithFunction(ctx, circles, thickness, ctxFunc, transformParameters)
}

export const drawCirclesFillSolid = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, color: string = 'black', transformParameters: TransformParameters = makeTransformParameters()) => {
    const ctxFunc = makeCtxFillFunc(ctx, color)
    drawCirclesFillWithFunction(ctx, circles, thickness, ctxFunc, transformParameters)
}

export const drawCirclesFillWithFunction = (ctx: CanvasRenderingContext2D, circles: Circle[], thickness: number = 5, ctxFunc: () => void, transformParameters: TransformParameters = makeTransformParameters()) => {
    ctx.beginPath()
    circles.forEach((circle: Circle) => {
        drawCircle(ctx, circle, thickness, transformParameters)
    })
    ctxFunc()
}
