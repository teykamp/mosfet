
import { Point, Mosfet, Visibility, RelativeDirection, AngleSlider, Circuit, VoltageSource } from '../types'
import { drawLine, transformPoint } from './drawFuncs'
import { makeTransformParameters } from './makeMosfet'
import { interpolateInferno } from 'd3' // https://stackoverflow.com/a/42505940
import { toSiPrefix } from './toSiPrefix'
import { toRadians } from './extraMath'
import { schematicOrigin, schematicScale, canvasSize } from '../constants'

const GLOBAL__LINE_THICKNESS = 6 // px

const makeCtxGradientFunc = (ctx: CanvasRenderingContext2D, gradient: CanvasGradient): (() => void) => {
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

const makeCtxFillFunc = (ctx: CanvasRenderingContext2D, color: string = 'black'): (() => void) => {
    const ctxFill = () => {
        ctx.fillStyle = color
        ctx.fill()
        ctx.beginPath()
    }
    return ctxFill
}

export const drawMosfet = (ctx: CanvasRenderingContext2D, mosfet: Mosfet) => {

    const transformParameters = makeTransformParameters(0, {x: false, y: false}, {x: 1, y: 1}, {x: mosfet.originX, y: mosfet.originY})
    if (mosfet.mirror) {
      transformParameters.mirror.x = true
    }

    // 100 % saturation -> 0 px
    // 50  % saturation -> 50 px
    // 0   % saturation -> 100 px
    mosfet.gradientSize = 125 - mosfet.saturationLevel * 125

    const gradientOrigin: Point = {x: mosfet.originX, y: mosfet.originY - 60 * (mosfet.mosfetType == 'nmos' ? 1 : -1)}
    const gradient = ctx.createRadialGradient(gradientOrigin.x, gradientOrigin.y, 0, gradientOrigin.x, gradientOrigin.y, mosfet.gradientSize)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)')

    const drawMosfetBody = (thickness: number = 5, ctxFunc: () => void = () => {}) => {
        drawLine(ctx, {x: 0, y: 20}, {x: 0, y: 60}, thickness, transformParameters)
        ctxFunc()
        drawLine(ctx, {x: 0, y: 20}, {x: 26, y: 20}, thickness, transformParameters)
        ctxFunc()
        drawLine(ctx, {x: 0, y: -20}, {x: 0, y: -60}, thickness, transformParameters)
        ctxFunc()
        drawLine(ctx, {x: 0, y: -20}, {x: 26, y: -20}, thickness, transformParameters)
        ctxFunc()
        drawLine(ctx, {x: 26, y: -40}, {x: 26, y: 40}, thickness, transformParameters)
        ctxFunc()
    }
    const drawMosfetGate = (thickness: number = 5, ctxFunc: () => void = () => {}) => {
        drawLine(ctx, {x: 40, y: 30}, {x: 40, y: -30}, thickness, transformParameters)
        ctxFunc()
        if (mosfet.mosfetType == 'nmos') {
            drawLine(ctx, {x: 40, y: 0}, {x: 60, y: 0}, thickness, transformParameters)
            ctxFunc()
        }
        else if (mosfet.mosfetType == 'pmos') {
            drawLine(ctx, {x: 50, y: 0}, {x: 60, y: 0}, thickness, transformParameters)
            ctxFunc()
            ctx.beginPath()
            const circleCenter = transformPoint({x: 45, y: 0}, transformParameters)
            ctx.moveTo(circleCenter.x, circleCenter.y)
            ctx.arc(circleCenter.x, circleCenter.y, 5 + GLOBAL__LINE_THICKNESS / 2, 0, 2 * Math.PI, false)
            ctx.arc(circleCenter.x, circleCenter.y, 5 - GLOBAL__LINE_THICKNESS / 2, 0, 2 * Math.PI, true)
            ctxFunc()
        }
    }

    ctx.beginPath()
    drawMosfetBody(GLOBAL__LINE_THICKNESS, makeCtxFillFunc(ctx, 'black'))
    // 50 mA -> colorScale of 1
    // 5 mA -> colorScale of 1
    // 500 uA -> colorScale of 0.8
    // 50 uA -> colorScale of 0.6
    // 5 uA -> colorScale of 0.4
    // 500 nA -> colorScale of 0.2
    // 50 nA -? colorScale of 0
    // 5 nA -? colorScale of 0
    // 500 pA -? colorScale of 0
    // 50 pA -? colorScale of 0
    // 5 pA -? colorScale of 0
    const forwardCurrentScaled = Math.max(Math.min(Math.log10(mosfet.forwardCurrent / 5e-3) * 0.2 + 1, 1), 0)
    const gateColor = interpolateInferno(forwardCurrentScaled)
    drawMosfetGate(GLOBAL__LINE_THICKNESS, makeCtxFillFunc(ctx, gateColor))
    drawMosfetBody(Math.ceil(GLOBAL__LINE_THICKNESS / 2) * 2, makeCtxGradientFunc(ctx, gradient))

    mosfet.schematicEffects[1].gradientSize = mosfet.gradientSize / 2
    mosfet.schematicEffects[1].color = 'white'
    mosfet.schematicEffects[0].gradientSize = forwardCurrentScaled * schematicScale * 2
    mosfet.schematicEffects[0].color = gateColor

    mosfet.dots.forEach(dot => {
        ctx.fillStyle = `rgba(0, 0, 255, ${Math.abs(-0.9 + Math.abs(dot.y - mosfet.originY) / 100)})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
        ctx.fill()
    })

    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'black'
    ctx.font = "14px sans-serif";
    ctx.moveTo(mosfet.originX, mosfet.originY)
    const currentToDisplay = toSiPrefix(mosfet.current, "A")
    let currentMantissa = ""
    for (const char of currentToDisplay) {
        if ("0123456789.".indexOf(char) > -1)
        currentMantissa += char
      }
    const currentSuffix = currentToDisplay.slice(currentMantissa.length)
    if (mosfet.mirror) {
        ctx.textAlign = 'left'
        ctx.fillText(currentMantissa, mosfet.originX - 22, mosfet.originY - 3)
        ctx.fillText(currentSuffix, mosfet.originX - 22, mosfet.originY + 12)
    } else {
        ctx.textAlign = 'right'
        ctx.fillText(currentMantissa, mosfet.originX + 22, mosfet.originY - 3)
        ctx.fillText(currentSuffix, mosfet.originX + 22, mosfet.originY + 12)

    }

    drawAngleSlider(ctx, mosfet.vgs)
    drawAngleSlider(ctx, mosfet.vds)
}

export const drawVoltageSource = (ctx: CanvasRenderingContext2D, voltageSource: VoltageSource) => {
    const radius = 30
    const symbolSize = 15
    const symbolHeight = 10
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 6
    // circle
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX + radius, voltageSource.originY)
    ctx.arc(voltageSource.originX, voltageSource.originY, radius, 0, 2 * Math.PI)
    ctx.stroke()
    // top and bottom lines
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX, voltageSource.originY + radius)
    ctx.lineTo(voltageSource.originX, voltageSource.originY + 60)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX, voltageSource.originY - radius)
    ctx.lineTo(voltageSource.originX, voltageSource.originY - 60)
    ctx.stroke()
    // plus
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX - symbolSize / 2, voltageSource.originY - symbolHeight)
    ctx.lineTo(voltageSource.originX + symbolSize / 2, voltageSource.originY - symbolHeight)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX, voltageSource.originY - symbolHeight - symbolSize / 2)
    ctx.lineTo(voltageSource.originX, voltageSource.originY - symbolHeight + symbolSize / 2)
    ctx.stroke()
    // minus
    ctx.beginPath()
    ctx.moveTo(voltageSource.originX - symbolSize / 2, voltageSource.originY + symbolHeight)
    ctx.lineTo(voltageSource.originX + symbolSize / 2, voltageSource.originY + symbolHeight)
    ctx.stroke()
    drawAngleSlider(ctx, voltageSource.voltageDrop)
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
        ctx.fillText(toSiPrefix(slider.value * (slider.displayNegative ? -1 : 1), 'V', 3), slider.location.x + 10, slider.location.y + 15)
    } else {
        ctx.fillText(slider.displayText, slider.location.x - 40, slider.location.y)
        ctx.font = '14px Arial'
        ctx.fillText(toSiPrefix(slider.value * (slider.displayNegative ? -1 : 1), 'V', 3), slider.location.x - 40, slider.location.y + 15)
    }
}

export const drawSchematic = (ctx: CanvasRenderingContext2D, circuit: Circuit) => {
    const transformParameters = makeTransformParameters(undefined, undefined, {x: schematicScale, y: schematicScale}, schematicOrigin)

    // draw vdd and gnd symbols
    circuit.schematic.gndLocations.forEach((gndLocation) => {
        drawGnd(ctx, transformPoint(gndLocation, transformParameters))
    })
    circuit.schematic.vddLocations.forEach((vddLocation) => {
        drawVdd(ctx, transformPoint(vddLocation, transformParameters))
    })

    // draw all the lines in black
    ctx.fillStyle = 'black'
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        node.lines.forEach((line) => {
            ctx.beginPath()
            drawLine(ctx, line.start, line.end, GLOBAL__LINE_THICKNESS, transformParameters)
            ctx.fill()
        })
    }

    // add gradient regions from each of the mosfets
    for (const mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]
        mosfet.schematicEffects.forEach((schematicEffect) => {
            const gradient = ctx.createRadialGradient(schematicEffect.origin.x, schematicEffect.origin.y, 0, schematicEffect.origin.x, schematicEffect.origin.y, schematicEffect.gradientSize)
            gradient.addColorStop(0, schematicEffect.color)
            gradient.addColorStop(0.5, schematicEffect.color)
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)')

            ctx.beginPath()
            schematicEffect.node.value.lines.forEach((line) => {
                drawLine(ctx, line.start, line.end, Math.ceil(GLOBAL__LINE_THICKNESS / 2) * 2, transformParameters)
                const ctxGradientFunc = makeCtxGradientFunc(ctx, gradient)
                ctxGradientFunc()
            })
        })
    }
}

export const drawGnd = (ctx: CanvasRenderingContext2D, origin: Point) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(origin.x + 15, origin.y)
    ctx.lineTo(origin.x, origin.y + 15)
    ctx.lineTo(origin.x - 15, origin.y)
    ctx.lineTo(origin.x, origin.y)
    ctx.stroke()
}

export const drawVdd = (ctx: CanvasRenderingContext2D, origin: Point) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(origin.x - 15, origin.y)
    ctx.lineTo(origin.x + 15, origin.y)
    ctx.stroke()
}
