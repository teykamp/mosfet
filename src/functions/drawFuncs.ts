import { Point, Line, Circle } from '../types'
import { canvasSize, lineDrawRepetitions } from '../constants'
import { Matrix } from 'ts-matrix'
import { GLOBAL_LINE_THICKNESS } from '../constants'

export const applyTransformationMatrix = (ctx: CanvasRenderingContext2D, transformationMatrix: Matrix, resetFirst: boolean = true) => {
    if (resetFirst) {
      ctx.setTransform(transformationMatrix.at(0, 0), transformationMatrix.at(1, 0), transformationMatrix.at(0, 1), transformationMatrix.at(1, 1), transformationMatrix.at(0, 2), transformationMatrix.at(1, 2))
    } else {
      ctx.transform(   transformationMatrix.at(0, 0), transformationMatrix.at(1, 0), transformationMatrix.at(0, 1), transformationMatrix.at(1, 1), transformationMatrix.at(0, 2), transformationMatrix.at(1, 2))
    }
  }

export const transformPoint = (point: Point, transformationMatrix: Matrix): Point => {
    const transformedVector = transformationMatrix.multiply(new Matrix(3, 1, [[point.x], [point.y], [1]]))
    return {
        x: transformedVector.at(0, 0),
        y: transformedVector.at(1, 0),
    }
}

export const fillTextGlobalReferenceFrame = (ctx: CanvasRenderingContext2D, textTransformationMatrix: Matrix, localTransformationMatrix: Matrix, localTextLocation: Point, text: string, autoTextAlign: boolean = false, oppositeTextAlign = false, lineHeight: number = 16): Point => {
    // switch to the global text reference frame
    applyTransformationMatrix(ctx, textTransformationMatrix)

    if (autoTextAlign) {
        const globalOrigin = transformPoint({x: 0, y: 0}, localTransformationMatrix)
        const globalTextLocation = transformPoint(localTextLocation, localTransformationMatrix)
        if ((globalTextLocation.x < globalOrigin.x) == (!oppositeTextAlign)) {
            ctx.textAlign = 'right'
        }
        else if ((globalTextLocation.x > globalOrigin.x) == (!oppositeTextAlign)) {
            ctx.textAlign = 'left'
        }
        else {
            ctx.textAlign = 'center'
        }
    }
    const displayTextLocation = transformPoint(localTextLocation, textTransformationMatrix.inverse().multiply(localTransformationMatrix))
    ctx.fillText(text, displayTextLocation.x, displayTextLocation.y)

    // reset the local reference frame
    applyTransformationMatrix(ctx, localTransformationMatrix)
    return transformPoint({x: displayTextLocation.x, y: displayTextLocation.y + lineHeight}, localTransformationMatrix.inverse().multiply(textTransformationMatrix))
}

export const getLocalLineThickness = (transformationMatrix: Matrix, lineThickness: number = GLOBAL_LINE_THICKNESS): number => {
    return lineThickness / Math.sqrt(Math.abs(transformationMatrix.determinant()))
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
