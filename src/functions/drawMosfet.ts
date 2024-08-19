
import { Point, Mosfet, Visibility, AngleSlider, Circuit, VoltageSource, Line, Circle, ParasiticCapacitor } from '../types'
import { drawLinesFillSolid, drawLinesFillWithGradient, drawCirclesFillSolid, makeStandardGradient, applyTransformationMatrix, getLocalLineThickness, fillTextGlobalReferenceFrame, transformPoint, getMovingDotPositions, drawCirclesFillWithGradient, transformPath } from './drawFuncs'
import { toSiPrefix } from './toSiPrefix'
import { toRadians } from './extraMath'
import { Matrix } from 'ts-matrix'
import { getForwardCurrentScaled, getGradientSizeFromSaturationLevel, getGateColorFromForwardCurrent } from './nonLinearMappingFunctions'

const drawCurrentDots = (ctx: CanvasRenderingContext2D, dotPath: Line[], currentPercentage: number, dotSize: number = 8, dotSpacing: number = 20, gradientSize: number = 60) => {
    const dots: Circle[] = getMovingDotPositions(dotPath, dotSpacing, currentPercentage).map((dotPosition: Point) => {
        return {center: dotPosition, outerDiameter: dotSize}
    })
    const currentGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gradientSize)
    currentGradient.addColorStop(0, 'rgba(0, 0, 255, 1)')
    currentGradient.addColorStop(1, 'rgba(0, 0, 255, 0)')
    drawCirclesFillWithGradient(ctx, dots, dotSize / 2, currentGradient)
}

export const drawMosfet = (ctx: CanvasRenderingContext2D, mosfet: Mosfet) => {
    applyTransformationMatrix(ctx, mosfet.transformationMatrix, true)
    const localLineThickness = getLocalLineThickness(mosfet.textTransformationMatrix, mosfet.transformationMatrix)

    const bodyLines: Line[] = [
        {start: {x: 0, y: 20}, end: {x: 0, y: 59}},
        {start: {x: 0, y: 20}, end: {x: 26, y: 20}},
        {start: {x: 0, y: -20}, end: {x: 0, y: -59}},
        {start: {x: 0, y: -20}, end: {x: 26, y: -20}},
        {start: {x: 26, y: -40}, end: {x: 26, y: 40}},
    ]

    const gateLines: Line[] = mosfet.mosfetType == 'nmos' ? [
        {start: {x: 40, y: 30}, end: {x: 40, y: -30}},
        {start: {x: 40, y: 0}, end: {x: 60, y: 0}},
    ] :
    [
        {start: {x: 40, y: 30}, end: {x: 40, y: -30}},
        {start: {x: 50, y: 0}, end: {x: 60, y: 0}},
    ]

    const gateCircles: Circle[] = mosfet.mosfetType == 'nmos' ? [] :
    [{center: {x: 45, y: 0}, outerDiameter: 10}]

    mosfet.gradientSize = getGradientSizeFromSaturationLevel(mosfet)
    const gradientOrigin: Point = {x: 0, y: -60 * (mosfet.mosfetType == 'nmos' ? 1 : -1)}
    const gradient = makeStandardGradient(ctx, gradientOrigin, mosfet.gradientSize, 'rgba(200, 200, 200, 1')

    const forwardCurrentScaled = getForwardCurrentScaled(mosfet)
    const gateColor = getGateColorFromForwardCurrent(mosfet)

    drawLinesFillSolid(ctx, bodyLines, localLineThickness, 'black')
    drawLinesFillSolid(ctx, gateLines, localLineThickness, gateColor)
    drawCirclesFillSolid(ctx, gateCircles, localLineThickness, gateColor)
    drawLinesFillWithGradient(ctx, bodyLines, localLineThickness, gradient)

    mosfet.schematicEffects["saturation"].gradientSize = mosfet.gradientSize / 30 * 3.5
    mosfet.schematicEffects["saturation"].color = 'rgba(200, 200, 200, 1)'
    mosfet.schematicEffects["gate"].gradientSize = forwardCurrentScaled * 3.5
    mosfet.schematicEffects["gate"].color = gateColor

    const dotPath: Line[] = [{
        start: {x: -15, y: -60},
        end: {x: -15, y: 60},
    }]
    drawCurrentDots(ctx, dotPath, mosfet.dotPercentage, 8, 20, 60)

    // display current read-out, separating quantity and unit on separate lines
    const currentToDisplay = toSiPrefix(mosfet.current, "A")
    let currentMantissa = ""
    for (const char of currentToDisplay) {
        if ("-0123456789.".indexOf(char) > -1)
            currentMantissa += char
    }
    const currentSuffix = currentToDisplay.slice(currentMantissa.length)

    ctx.fillStyle = 'black'
    ctx.font = "14px sans-serif";
    const nextLineLocation = fillTextGlobalReferenceFrame(ctx, mosfet.textTransformationMatrix, mosfet.transformationMatrix, {x: 20, y: -3}, currentMantissa, true, true, 14)
    ctx.font = "14px sans-serif";
    fillTextGlobalReferenceFrame(ctx, mosfet.textTransformationMatrix, mosfet.transformationMatrix, nextLineLocation, currentSuffix, true, true)

    // draw mosfet angle sliders
    drawAngleSlider(ctx, mosfet.vgs)
    drawAngleSlider(ctx, mosfet.vds)
}

export const drawVoltageSource = (ctx: CanvasRenderingContext2D, voltageSource: VoltageSource) => {
    applyTransformationMatrix(ctx, voltageSource.transformationMatrix, true)
    const localLineThickness = getLocalLineThickness(voltageSource.textTransformationMatrix, voltageSource.transformationMatrix)

    const radius = 30
    const symbolSize = 11
    const symbolHeight = 10
    ctx.strokeStyle = 'black'
    ctx.lineWidth = localLineThickness

    const majorLines: Line[] = [
        {start: {x: 0, y: radius}, end: {x: 0, y: 60}},
        {start: {x: 0, y: -radius}, end: {x: 0, y: -60}},
    ]
    const minorLines: Line[] = [
        {start: {x: symbolSize / 2, y: -symbolHeight}, end: {x: -symbolSize / 2, y: -symbolHeight}},
        {start: {x: 0, y: -symbolHeight - symbolSize / 2}, end: {x: 0, y: -symbolHeight + symbolSize / 2}},
        {start: {x: symbolSize / 2, y: symbolHeight}, end: {x: -symbolSize / 2, y: symbolHeight}},
    ]
    const circles: Circle[] = [
        {center: {x: 0, y: 0}, outerDiameter: 2 * radius},
    ]
    drawLinesFillSolid(ctx, majorLines, localLineThickness, 'black')
    drawLinesFillSolid(ctx, minorLines, localLineThickness * 0.8, 'black')
    drawCirclesFillSolid(ctx, circles, localLineThickness, 'black')

    drawAngleSlider(ctx, voltageSource.voltageDrop)
}

export const drawAngleSlider = (ctx: CanvasRenderingContext2D, slider: AngleSlider) => {
    if (slider.visibility == Visibility.Hidden) {
        return
    }
    applyTransformationMatrix(ctx, slider.transformationMatrix, true)
    const localLineThickness = getLocalLineThickness(slider.textTransformationMatrix, slider.transformationMatrix)

    // draw slider path
    ctx.strokeStyle = slider.visibility == Visibility.Visible ? 'orange' : 'lightgrey'
    ctx.lineWidth = localLineThickness
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

    ctx.font = '18px Arial'
    const nextLineLocation = fillTextGlobalReferenceFrame(ctx, slider.textTransformationMatrix, slider.transformationMatrix, textLocation, slider.displayText, true, false, 18)
    ctx.font = '16px Arial'
    fillTextGlobalReferenceFrame(ctx, slider.textTransformationMatrix, slider.transformationMatrix, nextLineLocation, toSiPrefix(slider.value * (slider.displayNegative ? -1 : 1), 'V', 3), true)
}

export const drawSchematic = (ctx: CanvasRenderingContext2D, circuit: Circuit) => {
    applyTransformationMatrix(ctx, circuit.transformationMatrix, true)
    const localLineThickness = getLocalLineThickness(circuit.textTransformationMatrix, circuit.transformationMatrix)

    // draw vdd and gnd symbols
    circuit.schematic.gndLocations.forEach((gndLocation) => {
        drawGnd(ctx, gndLocation, localLineThickness, 0.8)
    })
    circuit.schematic.vddLocations.forEach((vddLocation) => {
        drawVdd(ctx, vddLocation, localLineThickness, 0.8)
    })
    circuit.schematic.parasiticCapacitors.forEach((capacitor) => {
        drawParasiticCapacitor(ctx, capacitor)
    })
    applyTransformationMatrix(ctx, circuit.transformationMatrix, true)

    // draw all the lines in black
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        drawLinesFillSolid(ctx, node.lines, localLineThickness, 'black')
    }

    // Go through each key of the indexed object:

    // add gradient regions from each of the mosfets
    for (const mosfetId in circuit.devices.mosfets) {
        const mosfet = circuit.devices.mosfets[mosfetId]
        for (const schematicEffectName in mosfet.schematicEffects)
            {
            const schematicEffect = mosfet.schematicEffects[schematicEffectName];
            const gradientOrigin: Point = transformPoint(schematicEffect.origin, circuit.transformationMatrix.inverse().multiply(mosfet.transformationMatrix))
            const gradient = makeStandardGradient(ctx, gradientOrigin, schematicEffect.gradientSize, schematicEffect.color)
            drawLinesFillWithGradient(ctx, schematicEffect.node.value.lines, localLineThickness, gradient)
        }
    }

    // draw node voltage labels
    for (const nodeId in circuit.nodes) {
        const node = circuit.nodes[nodeId].value
        node.voltageDisplayLocations.forEach((labelLocation: Point) => {
            applyTransformationMatrix(ctx, circuit.textTransformationMatrix, true)

            const displayTextLocation = transformPoint(labelLocation, circuit.textTransformationMatrix.inverse().multiply(circuit.transformationMatrix))
            ctx.fillStyle = 'black'
            ctx.font = '18px sans-serif'
            ctx.fillText(node.voltageDisplayLabel + " = " + toSiPrefix(node.voltage, "V"), displayTextLocation.x, displayTextLocation.y)
        })
    }
}

export const drawParasiticCapacitor = (ctx: CanvasRenderingContext2D, capacitor: ParasiticCapacitor, displayCurrent: boolean = false) => {
    const localLineThickness = getLocalLineThickness(capacitor.textTransformationMatrix, capacitor.transformationMatrix)

    const localTransformationMatrix = capacitor.transformationMatrix.multiply(new Matrix(3, 3, [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 1]]))
    applyTransformationMatrix(ctx, localTransformationMatrix, true)

    const airGapSize = 7
    const capacitorLines: Line[] = [
        {start: {x: 0, y: 50}, end: {x: 0, y: airGapSize}},
        {start: {x: -30, y: airGapSize}, end: {x: 30, y: airGapSize}},
        {start: {x: -30, y: -airGapSize}, end: {x: 30, y: -airGapSize}},
        {start: {x: 0, y: -60}, end: {x: 0, y: -airGapSize}},
    ]
    const extraNodeLines = transformPath(capacitor.extraNodeLines, localTransformationMatrix.inverse().multiply(capacitor.circuitTransformationMatrix))

    drawLinesFillSolid(ctx, capacitorLines, localLineThickness, 'black')
    drawLinesFillSolid(ctx, extraNodeLines, localLineThickness, 'black')
    ctx.clearRect(-30 - localLineThickness, -airGapSize + localLineThickness / 2, 60 + 2 * localLineThickness, 2 * airGapSize - 2 * localLineThickness / 2)
    drawGnd(ctx, {x: 0, y: 50}, localLineThickness, 30)
    drawCurrentDots(ctx, [{start: {x: 10, y: -60}, end: {x: 10, y: 60}}], capacitor.dotPercentage, 8, 20, 60)

    if (displayCurrent) {
        ctx.fillStyle = 'black'
        ctx.font = '14px sans-serif'
        fillTextGlobalReferenceFrame(ctx, capacitor.textTransformationMatrix, localTransformationMatrix, {x: 40, y: 0}, toSiPrefix(capacitor.node.value.netCurrent, 'A'))
    }
}

export const drawGnd = (ctx: CanvasRenderingContext2D, origin: Point, lineThickness: number, symbolSize: number) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = lineThickness
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(origin.x + symbolSize / 2, origin.y)
    ctx.lineTo(origin.x, origin.y + symbolSize / 2)
    ctx.lineTo(origin.x - symbolSize / 2, origin.y)
    ctx.lineTo(origin.x, origin.y)
    ctx.stroke()
}

export const drawVdd = (ctx: CanvasRenderingContext2D, origin: Point, lineThickness: number, symbolSize: number) => {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = lineThickness
    ctx.beginPath()
    ctx.moveTo(origin.x - symbolSize / 2, origin.y)
    ctx.lineTo(origin.x + symbolSize / 2, origin.y)
    ctx.stroke()
}
