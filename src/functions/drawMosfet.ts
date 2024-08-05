
import { Point, Mosfet, Visibility, RelativeDirection, AngleSlider, Circuit } from '../types'
import { drawLine, transformPoint } from './drawFuncs'
import { makeTransformParameters } from './makeMosfet'
import { interpolateInferno } from 'd3' // https://stackoverflow.com/a/42505940
import { toSiPrefix } from './toSiPrefix'
import { toRadians } from './extraMath'
import { schematicOrigin, schematicScale } from '../constants'

const makeCtxGradientFunc = (ctx: CanvasRenderingContext2D, gradient: CanvasGradient): (() => void) => {
    const ctxGradient = () => {
        ctx.save()
        ctx.clip()
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 500, 500)
        ctx.restore()
        ctx.beginPath()
    }
    return ctxGradient
}

const makeCtxFillFunc = (ctx: CanvasRenderingContext2D, color: string = 'black'): (() => void) => {
    const ctxFill = () => {
        ctx.fillStyle = color
        ctx.fill()
        ctx.beginPath()
    }
    return ctxFill
}

export const drawMosfet = (ctx: CanvasRenderingContext2D, mosfet: Mosfet) => {
    const lineThickness = 5 // px

    const transformParameters = makeTransformParameters(0, {x: false, y: false}, {x: 1, y: 1}, {x: mosfet.originX, y: mosfet.originY})
    if (mosfet.mirror) {
      transformParameters.mirror.x = true
    }

    // 100 % saturation -> 0 px
    // 50  % saturation -> 50 px
    // 0   % saturation -> 100 px
    mosfet.gradientSize = 125 - mosfet.saturationLevel * 125
    const gradient = ctx.createRadialGradient(mosfet.originX, mosfet.originY - 60, 0, mosfet.originX, mosfet.originY - 60, mosfet.gradientSize)

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)')

    const drawMosfetBody = (thickness: number = 5, ctxFunc: () => void = () => {}) => {
      drawLine(ctx, {x: 0, y: 20}, {x: 0, y: 60}, thickness, transformParameters)
      ctxFunc()
      drawLine(ctx, {x: 0, y: 20}, {x: 30, y: 20}, thickness, transformParameters)
      ctxFunc()
      drawLine(ctx, {x: 0, y: -20}, {x: 0, y: -60}, thickness, transformParameters)
      ctxFunc()
      drawLine(ctx, {x: 0, y: -20}, {x: 30, y: -20}, thickness, transformParameters)
      ctxFunc()
      drawLine(ctx, {x: 30, y: -40}, {x: 30, y: 40}, thickness, transformParameters)
      ctxFunc()
    }
    const drawMosfetGate = (thickness: number = 5, ctxFunc: () => void = () => {}) => {
      drawLine(ctx, {x: 40, y: 30}, {x: 40, y: -30}, thickness, transformParameters)
      ctxFunc()
      drawLine(ctx, {x: 40, y: 0}, {x: 60, y: 0}, thickness, transformParameters)
      ctxFunc()
    }
    ctx.beginPath()
    drawMosfetBody(lineThickness, makeCtxFillFunc(ctx, 'black'))
    const gateColor = interpolateInferno((mosfet.vgs.value - mosfet.vgs.minValue) / (mosfet.vgs.maxValue - mosfet.vgs.minValue))
    drawMosfetGate(lineThickness, makeCtxFillFunc(ctx, gateColor))
    drawMosfetBody(Math.ceil(lineThickness / 2) * 2, makeCtxGradientFunc(ctx, gradient))

    mosfet.dots.forEach(dot => {
      ctx.fillStyle = `rgba(0, 0, 255, ${Math.abs(-0.9 + Math.abs(dot.y - mosfet.originY) / 100)})`
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    drawAngleSlider(ctx, mosfet.vgs)
    drawAngleSlider(ctx, mosfet.vds)

  }

export const drawAngleSlider = (ctx: CanvasRenderingContext2D, slider: AngleSlider) => {
    if (slider.visibility == Visibility.Hidden) {
        return
    }

    // draw slider path
    ctx.strokeStyle = slider.visibility == Visibility.Visible ? 'orange' : 'lightgrey'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(slider.center.x, slider.center.y, slider.radius, slider.startAngle, slider.endAngle, slider.CCW)

    // draw tail flourish on slider path
    const tailSize = 7
    ctx.moveTo(slider.center.x + (slider.radius + tailSize) * Math.cos(slider.startAngle), slider.center.y + (slider.radius + tailSize) * Math.sin(slider.startAngle))
    ctx.lineTo(slider.center.x + (slider.radius - tailSize) * Math.cos(slider.startAngle), slider.center.y + (slider.radius - tailSize) * Math.sin(slider.startAngle))

    // draw head flourish on slider path
    const headSize = 7
    const headDirection = slider.CCW ? 1 : -1
    const headAngle = headDirection * toRadians(5)
    ctx.moveTo(slider.center.x + (slider.radius + headSize) * Math.cos(slider.endAngle + headAngle), slider.center.y + (slider.radius + headSize) * Math.sin(slider.endAngle + headAngle))
    ctx.lineTo(slider.center.x + (slider.radius           ) * Math.cos(slider.endAngle            ), slider.center.y + (slider.radius           ) * Math.sin(slider.endAngle            ))
    ctx.lineTo(slider.center.x + (slider.radius - headSize) * Math.cos(slider.endAngle + headAngle), slider.center.y + (slider.radius - headSize) * Math.sin(slider.endAngle + headAngle))
    ctx.stroke()

    // draw draggable slider circle
    ctx.beginPath()
    ctx.arc(slider.location.x, slider.location.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = slider.visibility == Visibility.Visible ? 'rgb(255, 0, 0)' : 'lightgrey'
    ctx.fill()

    ctx.fillStyle = slider.visibility == Visibility.Visible ? '#000' : 'lightgrey'
    ctx.font = '16px Arial'
    if (slider.displayTextLocation == RelativeDirection.Right) {
        ctx.fillText(slider.displayText, slider.location.x + 10, slider.location.y)
        ctx.font = '14px Arial'
        ctx.fillText(toSiPrefix(slider.value, 'V', 3), slider.location.x + 10, slider.location.y + 15)
    } else {
        ctx.fillText(slider.displayText, slider.location.x - 40, slider.location.y)
        ctx.font = '14px Arial'
        ctx.fillText(toSiPrefix(slider.value, 'V', 3), slider.location.x - 40, slider.location.y + 15)
    }
}

export const drawSchematic = (ctx: CanvasRenderingContext2D, circuit: Circuit) => {
    const transformParameters = makeTransformParameters(undefined, undefined, {x: schematicScale, y: schematicScale}, schematicOrigin)

    // draw all the lines in black
    ctx.fillStyle = 'black'
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        node.lines.forEach((line) => {
            ctx.beginPath()
            drawLine(ctx, transformPoint(line.start, transformParameters), transformPoint(line.end, transformParameters), 5)
            ctx.fill()
        })
    }

    // add gradient regions from each of the mosfets
    for (const mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]
        mosfet.schematicEffects.forEach((effectPoint) => {
            // drawLinesFillWithGradient
        })
    }

}
