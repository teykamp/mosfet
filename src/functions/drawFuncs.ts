import { Point, TransformParameters } from '../types'

export const transformPoint = (point: Point, parameters: TransformParameters): Point => {
    let x = point.x
    let y = point.y

    // rotation
    x = x * Math.cos(parameters.rotation) - y * Math.sin(parameters.rotation)
    y = x * Math.sin(parameters.rotation) + y * Math.cos(parameters.rotation)
    // mirror
    if (parameters.mirror.x) {
        x *= -1
    }
    if (parameters.mirror.y) {
        y *= -1
    }
    // scaling
    x *= parameters.scale.x
    y *= parameters.scale.y
    // translation
    x += parameters.translation.x
    y += parameters.translation.y

    return {x, y}
}

export const drawLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point, thickness: number = 5) => {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2)

    const perpendicularX = (thickness / 2) / length * -deltaY
    const perpendicularY = (thickness / 2) / length * deltaX

    const corner0: Point = {x: start.x + perpendicularX, y: start.y + perpendicularY}
    const corner1: Point = {x: start.x - perpendicularX, y: start.y - perpendicularY}
    const corner2: Point = {x:   end.x - perpendicularX, y:   end.y - perpendicularY}
    const corner3: Point = {x:   end.x + perpendicularX, y:   end.y + perpendicularY}

    ctx.moveTo(corner0.x, corner0.y)
    ctx.lineTo(corner1.x, corner1.y)
    ctx.lineTo(corner2.x, corner2.y)
    ctx.lineTo(corner3.x, corner3.y)
}
