
import { Point, Mosfet, Visibility, AngleSlider, Circuit, VoltageSource, Line, Circle } from '../types'
import { drawLinesFillSolid, drawLinesFillWithGradient, drawCirclesFillSolid, makeStandardGradient, applyTransformationMatrix } from './drawFuncs'
import { interpolateInferno } from 'd3' // https://stackoverflow.com/a/42505940
import { toSiPrefix } from './toSiPrefix'
import { toRadians, modulo } from './extraMath'
import { Matrix } from 'ts-matrix'
import { getLineLength, getPointAlongLine } from './makeMosfet'

// const GLOBAL_LINE_THICKNESS = 6 // px
const GLOBAL_LINE_THICKNESS = 0.1 // px

export const drawMosfet = (ctx: CanvasRenderingContext2D, mosfet: Mosfet) => {
    applyTransformationMatrix(ctx, mosfet.transformationMatrix, true)

    // 100 % saturation -> 0 px
    // 50  % saturation -> 50 px
    // 0   % saturation -> 100 px
    mosfet.gradientSize = 1.5 - mosfet.saturationLevel * 1.5

    const gradientOrigin: Point = {x: 0, y: -2 * (mosfet.mosfetType == 'nmos' ? 1 : -1)}
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
        {start: {x: 1.73, y: 0}, end: {x: 2.00, y: 0}},
    ]

    const gateCircles: Circle[] = mosfet.mosfetType == 'nmos' ? [] :
    [{center: {x: 1.53, y: 0}, outerDiameter: 0.4}]

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
    drawLinesFillSolid(ctx, bodyLines, GLOBAL_LINE_THICKNESS, 'black')
    drawLinesFillSolid(ctx, gateLines, GLOBAL_LINE_THICKNESS, gateColor)
    drawCirclesFillSolid(ctx, gateCircles, GLOBAL_LINE_THICKNESS, gateColor)
    drawLinesFillWithGradient(ctx, bodyLines, GLOBAL_LINE_THICKNESS, gradient)

    mosfet.schematicEffects[1].gradientSize = mosfet.gradientSize * 2
    mosfet.schematicEffects[1].color = 'rgba(200, 200, 200, 1)'
    mosfet.schematicEffects[0].gradientSize = forwardCurrentScaled * 2
    mosfet.schematicEffects[0].color = gateColor

    const dotPath: Line = {
        start: {x: -0.5, y: -2},
        end: {x: -0.5, y: 2},
    }
    const dotTravelDistance = getLineLength(dotPath)
    const nDots = 6
    for (let n = 0; n < nDots; n++) {
        const thisDotPercentage = modulo(mosfet.dotPercentage + n / nDots, 1)
        const dotPosition = getPointAlongLine(dotPath, thisDotPercentage)
        ctx.fillStyle = `rgba(0, 0, 255, ${(0.50 - Math.abs(thisDotPercentage - 0.50)) * 2})`
        ctx.arc(dotPosition.x, dotPosition.y, 0.1, 0, Math.PI * 2)
        ctx.fill()
    }

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
    ctx.arc(0, 0, slider.radius, 0, slider.endAngle, false)

    // switch head and tail if the min and max are negative valued
    const headAngle = slider.displayNegative ? 0 : slider.endAngle
    const tailAngle = slider.displayNegative ? slider.endAngle : 0

    // draw tail flourish on slider path
    const tailSize = 7
    ctx.moveTo((slider.radius + tailSize) * Math.cos(tailAngle), (slider.radius + tailSize) * Math.sin(tailAngle))
    ctx.lineTo((slider.radius - tailSize) * Math.cos(tailAngle), (slider.radius - tailSize) * Math.sin(tailAngle))

    // draw head flourish on slider path
    const headSize = 7
    const headDirection = (slider.displayNegative) ? 1 : -1
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
            drawTickAtAngle((slider.endAngle) * percentValue, true)
            x += 1
        }
        x = Math.ceil(slider.temporaryMinValue + 0.5) - 0.5 // minor ticks every 1 unit starting on n + 1/2 for integer n
        while (x < slider.temporaryMaxValue) {
            const percentValue = (x - slider.temporaryMinValue) / (slider.temporaryMaxValue - slider.temporaryMinValue)
            drawTickAtAngle((slider.endAngle) * percentValue, false)
            x += 1
        }
    }

    // draw draggable slider circle
    ctx.beginPath()
    ctx.arc(slider.location.x, slider.location.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = slider.visibility == Visibility.Visible ? 'rgb(255, 0, 0)' : 'lightgrey'
    ctx.fill()

    ctx.fillStyle = slider.visibility == Visibility.Visible ? '#000' : 'lightgrey'

    const textLocation: Point = {
        x: slider.location.x * (slider.radius + 15) / slider.radius,
        y: slider.location.y * (slider.radius + 15) / slider.radius,
    }

    applyTransformationMatrix(ctx, slider.textTransformationMatrix, true)
    const displayTextLocationVector = slider.textTransformationMatrix.inverse().multiply(slider.transformationMatrix.multiply(new Matrix(3, 1, [[textLocation.x], [textLocation.y], [1]])))
    const globalSliderLocationVector = slider.textTransformationMatrix.inverse().multiply(slider.transformationMatrix.multiply(new Matrix(3, 1, [[slider.location.x], [slider.location.y], [1]])))
    const globalSliderDirectionX = displayTextLocationVector.at(0, 0) - globalSliderLocationVector.at(0, 0)

    const displayTextLocation: Point = {
        x: displayTextLocationVector.at(0, 0),
        y: displayTextLocationVector.at(1, 0),
    }
    ctx.textAlign = globalSliderDirectionX > 0 ? 'left' : 'right'
    ctx.font = '18px Arial'
    ctx.fillText(slider.displayText, displayTextLocation.x, displayTextLocation.y - 0)
    ctx.font = '16px Arial'
    ctx.fillText(toSiPrefix(slider.value * (slider.displayNegative ? -1 : 1), 'V', 3), displayTextLocation.x, displayTextLocation.y + 18)
}

export const drawSchematic = (ctx: CanvasRenderingContext2D, circuit: Circuit) => {
    applyTransformationMatrix(ctx, circuit.transformationMatrix, true)

    // draw vdd and gnd symbols
    circuit.schematic.gndLocations.forEach((gndLocation) => {
        drawGnd(ctx, gndLocation)
    })
    circuit.schematic.vddLocations.forEach((vddLocation) => {
        drawVdd(ctx, vddLocation)
    })

    // draw all the lines in black
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        drawLinesFillSolid(ctx, node.lines, GLOBAL_LINE_THICKNESS, 'black')
    }

    // add gradient regions from each of the mosfets
    for (const mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]
        mosfet.schematicEffects.forEach((schematicEffect) => {
            const gradientOrigin: Point = {
                x: circuit.transformationMatrix.inverse().multiply(mosfet.transformationMatrix).multiply(new Matrix(3, 1, [[schematicEffect.origin.x], [schematicEffect.origin.y], [1]])).at(0, 0),
                y: circuit.transformationMatrix.inverse().multiply(mosfet.transformationMatrix).multiply(new Matrix(3, 1, [[schematicEffect.origin.x], [schematicEffect.origin.y], [1]])).at(1, 0),
            }
            const gradient = makeStandardGradient(ctx, gradientOrigin, schematicEffect.gradientSize, schematicEffect.color)
            drawLinesFillWithGradient(ctx, schematicEffect.node.value.lines, GLOBAL_LINE_THICKNESS, gradient)
        })
    }

    // draw node voltage labels
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        node.voltageDisplayLocations.forEach((labelLocation: Point) => {
            applyTransformationMatrix(ctx, circuit.textTransformationMatrix, true)

            const displayTextLocationVector = circuit.textTransformationMatrix.inverse().multiply(circuit.transformationMatrix.multiply(new Matrix(3, 1, [[labelLocation.x], [labelLocation.y], [1]])))
            const displayTextLocation: Point = {
                x: displayTextLocationVector.at(0, 0),
                y: displayTextLocationVector.at(1, 0),
            }
            ctx.fillStyle = 'black'
            ctx.font = '18px sans-serif'
            ctx.fillText(node.voltageDisplayLabel + " = " + toSiPrefix(node.voltage, "V"), displayTextLocation.x, displayTextLocation.y)
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
