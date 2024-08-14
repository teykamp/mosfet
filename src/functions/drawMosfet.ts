
import { Point, Mosfet, Visibility, AngleSlider, Circuit, VoltageSource, Line, Circle } from '../types'
import { drawLine, transformPoint, makeCtxGradientFunc, drawLinesFillSolid, drawLinesFillWithGradient, drawCirclesFillSolid, makeStandardGradient, applyTransformationMatrix } from './drawFuncs'
import { makeTransformParameters } from './makeMosfet'
import { interpolateInferno } from 'd3' // https://stackoverflow.com/a/42505940
import { toSiPrefix } from './toSiPrefix'
import { toRadians } from './extraMath'
import { schematicOrigin, schematicScale } from '../constants'

// const GLOBAL_LINE_THICKNESS = 6 // px
const GLOBAL_LINE_THICKNESS = 0.1 // px

export const drawMosfet = (ctx: CanvasRenderingContext2D, mosfet: Mosfet) => {
    applyTransformationMatrix(ctx, mosfet.transformationMatrix, true)

    // const transformParameters = makeTransformParameters(0, {x: false, y: false}, {x: 60, y: 60}, {x: mosfet.originX, y: mosfet.originY})
    // if (mosfet.mirror) {
    //   transformParameters.mirror.x = true
    // }
    const transformParameters = makeTransformParameters()

    // 100 % saturation -> 0 px
    // 50  % saturation -> 50 px
    // 0   % saturation -> 100 px
    mosfet.gradientSize = 125 - mosfet.saturationLevel * 125

    const gradientOrigin: Point = {x: 0, y: -1 * (mosfet.mosfetType == 'nmos' ? 1 : -1)}
    const gradient = makeStandardGradient(ctx, gradientOrigin, mosfet.gradientSize, 'rgba(200, 200, 200, 1')

    const bodyLines: Line[] = [
        {start: {x: 0, y: 0.66}, end: {x: 0, y: 1.90}},
        {start: {x: 0, y: 0.66}, end: {x: 0.86, y: 0.66}},
        {start: {x: 0, y: -0.66}, end: {x: 0, y: -1.90}},
        {start: {x: 0, y: -0.66}, end: {x: 0.86, y: -0.66}},
        {start: {x: 0.86, y: -1.33}, end: {x: 0.86, y: 1.33}},
    ]

    const gateLines: Line[] = mosfet.mosfetType == 'nmos' ? [
        {start: {x: 1.33, y: 1}, end: {x: 1.33, y: -1}},
        {start: {x: 1.33, y: 0}, end: {x: 2.00, y: 0}},
    ] :
    [
        {start: {x: 1.33, y: 1}, end: {x: 1.33, y: -1}},
        {start: {x: 1.90, y: 0}, end: {x: 2.00, y: 0}},
    ]

    const gateCircles: Circle[] = mosfet.mosfetType == 'nmos' ? [] : [{center: {x: 0.76, y: 0}, outerDiameter: 0.30}]

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

    ctx.beginPath()
    drawLinesFillSolid(ctx, bodyLines, GLOBAL_LINE_THICKNESS, 'black', transformParameters)
    drawLinesFillSolid(ctx, gateLines, GLOBAL_LINE_THICKNESS, gateColor, transformParameters)
    drawCirclesFillSolid(ctx, gateCircles, GLOBAL_LINE_THICKNESS, gateColor, transformParameters)
    drawLinesFillWithGradient(ctx, bodyLines, GLOBAL_LINE_THICKNESS, gradient, transformParameters)

    mosfet.schematicEffects[1].gradientSize = mosfet.gradientSize / 2
    mosfet.schematicEffects[1].color = 'rgba(200, 200, 200, 1)'
    mosfet.schematicEffects[0].gradientSize = forwardCurrentScaled * schematicScale * 2
    mosfet.schematicEffects[0].color = gateColor

    mosfet.dots.forEach(dot => {
        ctx.fillStyle = `rgba(0, 0, 255, ${Math.abs(-0.9 + Math.abs(dot.y) / 100)})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
        ctx.fill()
    })

    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'black'
    ctx.font = "0.2px sans-serif";
    ctx.moveTo(0, 0)

    const currentToDisplay = toSiPrefix(mosfet.current, "A")
    let currentMantissa = ""
    for (const char of currentToDisplay) {
        if ("-0123456789.".indexOf(char) > -1)
        currentMantissa += char
      }
    const currentSuffix = currentToDisplay.slice(currentMantissa.length)

    if (mosfet.mirror) {
        ctx.textAlign = 'left'
        ctx.fillText(currentMantissa, -22, -3)
        ctx.fillText(currentSuffix, -22, 12)
    } else {
        ctx.textAlign = 'right'
        ctx.fillText(currentMantissa, 22, -3)
        ctx.fillText(currentSuffix, 22, 12)

    }

    drawAngleSlider(ctx, mosfet.vgs)
    drawAngleSlider(ctx, mosfet.vds)
}

export const drawVoltageSource = (ctx: CanvasRenderingContext2D, voltageSource: VoltageSource) => {
    applyTransformationMatrix(ctx, voltageSource.transformationMatrix, true)

    const radius = 1
    const symbolSize = 0.5
    const symbolHeight = 0.35
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 0.1
    // circle
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.arc(0, 0, radius, 0, 2 * Math.PI)
    ctx.stroke()
    // top and bottom lines
    ctx.beginPath()
    ctx.moveTo(0, radius)
    ctx.lineTo(0, 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -radius)
    ctx.lineTo(0, -2)
    ctx.stroke()
    // plus
    ctx.lineWidth = 0.1
    ctx.beginPath()
    ctx.moveTo(symbolSize / 2, -symbolHeight)
    ctx.lineTo(-symbolSize / 2, -symbolHeight)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -symbolHeight - symbolSize / 2)
    ctx.lineTo(0, -symbolHeight + symbolSize / 2)
    ctx.stroke()
    // minus
    ctx.beginPath()
    ctx.moveTo(symbolSize / 2, symbolHeight)
    ctx.lineTo(-symbolSize / 2, symbolHeight)
    ctx.stroke()
    drawAngleSlider(ctx, voltageSource.voltageDrop)
}

export const drawAngleSlider = (ctx: CanvasRenderingContext2D, slider: AngleSlider) => {
    if (slider.visibility == Visibility.Hidden) {
        return
    }
    applyTransformationMatrix(ctx, slider.transformationMatrix, true)

    // draw slider path
    ctx.strokeStyle = slider.visibility == Visibility.Visible ? 'orange' : 'lightgrey'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(slider.center.x, slider.center.y, slider.radius, slider.startAngle, slider.endAngle, slider.CCW)

    // switch head and tail if the min and max are negative valued
    const headAngle = slider.displayNegative ? slider.startAngle : slider.endAngle
    const tailAngle = slider.displayNegative ? slider.endAngle : slider.startAngle

    // draw tail flourish on slider path
    const tailSize = 7
    ctx.moveTo((slider.radius + tailSize) * Math.cos(tailAngle), (slider.radius + tailSize) * Math.sin(tailAngle))
    ctx.lineTo((slider.radius - tailSize) * Math.cos(tailAngle), (slider.radius - tailSize) * Math.sin(tailAngle))

    // draw head flourish on slider path
    const headSize = 7
    const headDirection = (slider.CCW != slider.displayNegative) ? 1 : -1
    const arrowAngle = headDirection * toRadians(5)
    ctx.moveTo((slider.radius + headSize) * Math.cos(headAngle + arrowAngle), (slider.radius + headSize) * Math.sin(headAngle + arrowAngle))
    ctx.lineTo((slider.radius           ) * Math.cos(headAngle            ), (slider.radius           ) * Math.sin(headAngle            ))
    ctx.lineTo((slider.radius - headSize) * Math.cos(headAngle + arrowAngle), (slider.radius - headSize) * Math.sin(headAngle + arrowAngle))
    ctx.stroke()

    if (slider.dragging && slider.preciseDragging) {
        // draw tick marks
        const drawTickAtAngle = (angle: number, majorTick: boolean = true) => {
            const outerRadius = slider.radius + (majorTick ? 15 : 8)
            ctx.beginPath()
            ctx.moveTo(slider.radius * Math.cos(angle), slider.radius * Math.sin(angle))
            ctx.lineTo(outerRadius * Math.cos(angle),   outerRadius   * Math.sin(angle))
            ctx.stroke()
        }
        // find all locations between temporaryMinValue and temporaryMaxValue that should have a tick and draw one
        let x = Math.ceil(slider.temporaryMinValue) // major ticks every 1 unit
        while (x < slider.temporaryMaxValue) {
            const percentValue = (x - slider.temporaryMinValue) / (slider.temporaryMaxValue - slider.temporaryMinValue)
            drawTickAtAngle(slider.startAngle + (slider.endAngle - slider.startAngle) * percentValue, true)
            x += 1
        }
        x = Math.ceil(slider.temporaryMinValue + 0.5) - 0.5 // minor ticks every 1 unit starting on n + 1/2 for integer n
        while (x < slider.temporaryMaxValue) {
            const percentValue = (x - slider.temporaryMinValue) / (slider.temporaryMaxValue - slider.temporaryMinValue)
            drawTickAtAngle(slider.startAngle + (slider.endAngle - slider.startAngle) * percentValue, false)
            x += 1
        }
    }

    // draw draggable slider circle
    ctx.beginPath()
    ctx.arc(slider.location.x, slider.location.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = slider.visibility == Visibility.Visible ? 'rgb(255, 0, 0)' : 'lightgrey'
    ctx.fill()

    ctx.fillStyle = slider.visibility == Visibility.Visible ? '#000' : 'lightgrey'

    // draw text label
    const textHeight = 32
    const sliderAngle = Math.atan2(slider.location.y - slider.center.y, slider.location.x - slider.center.x)
    const adjustedSliderRadius = slider.radius + 15
    const adjustedSliderPosition: Point = {x: adjustedSliderRadius * Math.cos(sliderAngle), y: adjustedSliderRadius * Math.sin(sliderAngle)}
    const lowerYposition = adjustedSliderPosition.y + Math.cos(sliderAngle) * textHeight / 2
    const upperYposition = adjustedSliderPosition.y - Math.cos(sliderAngle) * textHeight / 2
    const lowerAngle = Math.atan2(lowerYposition, adjustedSliderPosition.x)
    const upperAngle = Math.atan2(upperYposition, adjustedSliderPosition.x)
    const lowerXposition = Math.cos(lowerAngle) * adjustedSliderRadius
    const upperXposition = Math.cos(upperAngle) * adjustedSliderRadius
    let finalXposition = lowerXposition
    if (Math.abs(upperXposition) > Math.abs(lowerXposition)) {
        finalXposition = upperXposition
    }
    if (Math.sign(lowerAngle) != Math.sign(upperAngle)) {
        if ((Math.abs(lowerAngle) < Math.PI) && (Math.abs(upperAngle) < Math.PI / 2)) {
            finalXposition = adjustedSliderRadius
        } else {
            finalXposition = -adjustedSliderRadius
        }
    }
    const finalYposition = finalXposition * Math.tan(sliderAngle)

    const displayTextLocation: Point = {
        x: slider.center.x + finalXposition,
        y: slider.center.y + finalYposition
    }
    ctx.textAlign = (((-Math.PI / 2) < sliderAngle) && ((Math.PI / 2) > sliderAngle)) ? 'left' : 'right'
    ctx.font = '2px Arial'
    ctx.fillText(slider.displayText, displayTextLocation.x, displayTextLocation.y - 0)
    ctx.font = '1.8px Arial'
    ctx.fillText(toSiPrefix(slider.value * (slider.displayNegative ? -1 : 1), 'V', 3), displayTextLocation.x, displayTextLocation.y + 16)
}

export const drawSchematic = (ctx: CanvasRenderingContext2D, circuit: Circuit) => {
    applyTransformationMatrix(ctx, circuit.transformationMatrix, true)

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
            drawLine(ctx, line.start, line.end, GLOBAL_LINE_THICKNESS, transformParameters)
            ctx.fill()
        })
    }

    // add gradient regions from each of the mosfets
    for (const mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]
        mosfet.schematicEffects.forEach((schematicEffect) => {
            const gradient = makeStandardGradient(ctx, schematicEffect.origin, schematicEffect.gradientSize, schematicEffect.color)

            ctx.beginPath()
            schematicEffect.node.value.lines.forEach((line) => {
                drawLine(ctx, line.start, line.end, Math.ceil(GLOBAL_LINE_THICKNESS / 2) * 2, transformParameters)
                const ctxGradientFunc = makeCtxGradientFunc(ctx, gradient)
                ctxGradientFunc()
            })
        })
    }

    // draw node voltage labels
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        node.voltageDisplayLocations.forEach((labelLocation: Point) => {
            const transformedLocation = transformPoint(labelLocation, transformParameters)
            ctx.fillStyle = 'black'
            ctx.font = '0.6px sans-serif'
            ctx.fillText(node.voltageDisplayLabel + " = " + toSiPrefix(node.voltage, "V"), transformedLocation.x, transformedLocation.y + 4)
        })
    }
}

export const drawGnd = (ctx: CanvasRenderingContext2D, origin: Point) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = GLOBAL_LINE_THICKNESS
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(origin.x + 0.25, origin.y)
    ctx.lineTo(origin.x, origin.y + 0.25)
    ctx.lineTo(origin.x - 0.25, origin.y)
    ctx.lineTo(origin.x, origin.y)
    ctx.stroke()
}

export const drawVdd = (ctx: CanvasRenderingContext2D, origin: Point) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = GLOBAL_LINE_THICKNESS
    ctx.beginPath()
    ctx.moveTo(origin.x - 0.25, origin.y)
    ctx.lineTo(origin.x + 0.25, origin.y)
    ctx.stroke()
}
