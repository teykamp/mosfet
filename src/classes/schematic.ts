import { Point, SchematicEffect } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ParasiticCapacitor } from "./parasiticCapacitor"
import { Ref } from "vue"
import { drawLinesFillSolid, drawLinesFillWithGradient, makeStandardGradient } from "../functions/drawFuncs"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { toSiPrefix } from "../functions/toSiPrefix"

export class Schematic extends CtxArtist{
    vddLocations: Point[] // a list of locations to draw vdd symbols
    gndLocations: Point[] // a list of locations to draw gnd symbols
    parasiticCapacitors: ParasiticCapacitor[]
    mosfets: Mosfet[]
    nodes: Ref<Node>[]

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], gndLocations: Point[], vddLocations: Point[], parasiticCapacitors: ParasiticCapacitor[], mosfets: Mosfet[], nodes: Ref<Node>[]) {
        super(parentTransformations, new TransformationMatrix())
        this.vddLocations = vddLocations
        this.gndLocations = gndLocations
        this.parasiticCapacitors = parasiticCapacitors
        this.mosfets = mosfets
        this.nodes = nodes
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)

        // draw vdd and gnd symbols
        this.gndLocations.forEach((gndLocation) => {
            Schematic.drawGnd(ctx, gndLocation, this.localLineThickness, 0.8)
        })
        this.vddLocations.forEach((vddLocation) => {
            Schematic.drawVdd(ctx, vddLocation, this.localLineThickness, 0.8)
        })
        this.parasiticCapacitors.forEach((capacitor) => {
            capacitor.draw(ctx)
        })

        // reset transformation matrix after drawing parasitic capacitor
        this.transformationMatrix.transformCanvas(ctx)

        // draw all the lines in black
        this.nodes.forEach((node: Ref<Node>) => {
            drawLinesFillSolid(ctx, node.value.lines, this.localLineThickness, 'black')
        })

        // add gradient regions from each of the mosfets
        this.mosfets.forEach((mosfet: Mosfet) => {
            Object.values(mosfet.schematicEffects).forEach((schematicEffect: SchematicEffect) => {
                const gradientOrigin: Point = this.transformationMatrix.inverse().multiply(mosfet.transformationMatrix).transformPoint(schematicEffect.origin)
                const gradient = makeStandardGradient(ctx, gradientOrigin, schematicEffect.gradientSize, schematicEffect.color)
                drawLinesFillWithGradient(ctx, schematicEffect.node.value.lines, this.localLineThickness, gradient)
            })
        })

        // draw node voltage labels
        this.nodes.forEach((node: Ref<Node>) => {
            node.value.voltageDisplayLocations.forEach((labelLocation: Point) => {
                ctx.fillStyle = 'black'
                ctx.font = '18px sans-serif'
                this.fillTextGlobalReferenceFrame(ctx, labelLocation, node.value.voltageDisplayLabel + " = " + toSiPrefix(node.value.voltage, "V"), false)
            })
        })
    }

    static drawGnd(ctx: CanvasRenderingContext2D, origin: Point, lineThickness: number, symbolSize: number) {
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

    static drawVdd(ctx: CanvasRenderingContext2D, origin: Point, lineThickness: number, symbolSize: number) {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = lineThickness
        ctx.beginPath()
        ctx.moveTo(origin.x - symbolSize / 2, origin.y)
        ctx.lineTo(origin.x + symbolSize / 2, origin.y)
        ctx.stroke()
    }
}
