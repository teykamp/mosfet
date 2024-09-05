import { Point, SchematicEffect } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ParasiticCapacitor } from "./parasiticCapacitor"
import { Ref } from "vue"
import { drawLinesFillSolid, drawLinesFillWithGradient, makeStandardGradient } from "../functions/drawFuncs"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { toSiPrefix } from "../functions/toSiPrefix"
import { GndSymbol, VddSymbol } from "./powerSymbols"

export class Schematic extends CtxArtist{
    gndSymbols: GndSymbol[] // a list of locations to draw gnd symbols
    vddSymbols: VddSymbol[] // a list of locations to draw vdd symbols
    parasiticCapacitors: ParasiticCapacitor[]
    mosfets: Mosfet[]
    nodes: Ref<Node>[]

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], gndSymbols: GndSymbol[], vddSymbols: VddSymbol[], parasiticCapacitors: ParasiticCapacitor[], mosfets: Mosfet[], nodes: Ref<Node>[]) {
        super(parentTransformations, new TransformationMatrix())
        this.gndSymbols = gndSymbols
        this.vddSymbols = vddSymbols
        this.parasiticCapacitors = parasiticCapacitors
        this.mosfets = mosfets
        this.nodes = nodes
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.transformationMatrix.transformCanvas(ctx)

        // draw vdd and gnd symbols
        this.gndSymbols.forEach((symbol) => {
            symbol.draw(ctx)
        })
        this.vddSymbols.forEach((symbol) => {
            symbol.draw(ctx)
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
}
