import { FlattenedSchematicEffect, Point, SchematicEffect, Wire } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ParasiticCapacitor } from "./parasiticCapacitor"
import { ref, Ref } from "vue"
import { drawLinesFillSolid, drawLinesFillWithGradient, makeStandardGradient } from "../functions/drawFuncs"
import { Mosfet } from "./mosfet"
import { Node } from "./node"
import { toSiPrefix } from "../functions/toSiPrefix"
import { GndSymbol, VddSymbol } from "./powerSymbols"
import { TectonicLine, TectonicPoint } from "./tectonicPlate"

export class Schematic extends CtxArtist{
    gndSymbols: GndSymbol[] // a list of locations to draw gnd symbols
    vddSymbols: VddSymbol[] // a list of locations to draw vdd symbols
    parasiticCapacitors: ParasiticCapacitor[]
    mosfets: Mosfet[]
    nodes: Ref<Node>[]
    wires: Wire[]

    constructor(parentTransformations: Ref<TransformationMatrix>[] = [], gndSymbols: GndSymbol[] = [], vddSymbols: VddSymbol[] = [], parasiticCapacitors: ParasiticCapacitor[] = [], mosfets: Mosfet[] = [], nodes: Ref<Node>[] = [], wires: Wire[] = []) {
        super(parentTransformations, new TransformationMatrix())
        this.gndSymbols = gndSymbols
        this.vddSymbols = vddSymbols
        this.parasiticCapacitors = parasiticCapacitors
        this.mosfets = mosfets
        this.nodes = nodes
        this.wires = wires
    }

    copy(): Schematic {
        const transformations = [ref(new TransformationMatrix()) as Ref<TransformationMatrix>, ref(new TransformationMatrix()) as Ref<TransformationMatrix>]
        const newSchematic = new Schematic(
            transformations,
            [],
            [],
            // this.gndSymbols.map(symbol => symbol.copy(transformations)),
            // this.vddSymbols.map(symbol => symbol.copy(transformations)),
            [], // ignore the parasitic capacitors
            this.mosfets,
            this.nodes,
            this.wires
        )
        newSchematic.gndSymbols = this.gndSymbols.map(symbol => symbol.copy(newSchematic.transformations)),
        newSchematic.vddSymbols = this.vddSymbols.map(symbol => symbol.copy(newSchematic.transformations)),

        newSchematic.wires.forEach((wire: Wire) => {wire.voltageDisplayLocations = []})
        return newSchematic
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

        // reset gradient regions at each node
        this.nodes.forEach((node: Ref<Node>) => {
            node.value.schematicEffects = []
        })

        // add gradient regions from each of the mosfets
        this.mosfets.forEach((mosfet: Mosfet) => {
            Object.values(mosfet.schematicEffects).forEach((schematicEffect: SchematicEffect) => {
                const flattenedSchematicEffect: FlattenedSchematicEffect = Schematic.flattenSchematicEffect(schematicEffect)
                schematicEffect.node.value.schematicEffects.push(flattenedSchematicEffect)
            })
        })

        this.wires.forEach((wire: Wire) => {
            // draw all the lines in black,
            drawLinesFillSolid(ctx, wire.lines.map((line: TectonicLine) => line.toLine()), this.localLineThickness, 'black')

            // then draw the gradient regions
            wire.node.value.schematicEffects.forEach((schematicEffect: FlattenedSchematicEffect) => {
                const gradientOrigin: Point = schematicEffect.origin // this.transformationMatrix.inverse().multiply(mosfet.transformationMatrix).transformPoint(schematicEffect.origin)
                const gradient = makeStandardGradient(ctx, gradientOrigin, schematicEffect.gradientSize, schematicEffect.color)

                drawLinesFillWithGradient(ctx, wire.lines.map((line: TectonicLine) => line.toLine()), this.localLineThickness, gradient)
            })

            // draw the node voltage labels
            wire.voltageDisplayLocations.forEach((labelLocation: TectonicPoint) => {
                ctx.fillStyle = 'black'
                ctx.font = '18px sans-serif'
                this.fillTextGlobalReferenceFrame(ctx, labelLocation.toPoint(), wire.voltageDisplayLabel + " = " + toSiPrefix(wire.node.value.voltage, "V"), false)
            })
        })

        // this.nodes.forEach((node: Ref<Node>) => {
            //     drawLinesFillSolid(ctx, node.value.lines, this.localLineThickness, 'black')
        // })

        // add gradient regions from each of the mosfets
        // this.mosfets.forEach((mosfet: Mosfet) => {
            //     Object.values(mosfet.schematicEffects).forEach((schematicEffect: SchematicEffect) => {
        //         const gradientOrigin: Point = this.transformationMatrix.inverse().multiply(mosfet.transformationMatrix).transformPoint(schematicEffect.origin)
        //         const gradient = makeStandardGradient(ctx, gradientOrigin, schematicEffect.gradientSize, schematicEffect.color)

        //         drawLinesFillWithGradient(ctx, schematicEffect.node.value.lines, this.localLineThickness, gradient)
        //     })
        // })

        // // draw node voltage labels
        // this.nodes.forEach((node: Ref<Node>) => {
            //     node.value.voltageDisplayLocations.forEach((labelLocation: Point) => {
        //         ctx.fillStyle = 'black'
        //         ctx.font = '18px sans-serif'
        //         this.fillTextGlobalReferenceFrame(ctx, labelLocation, node.value.voltageDisplayLabel + " = " + toSiPrefix(node.value.voltage, "V"), false)
        //     })
        // })
    }

    static flattenSchematicEffect(schematicEffect: SchematicEffect): FlattenedSchematicEffect {
        return {
            origin: schematicEffect.origin.toPoint(),
            color: schematicEffect.color,
            gradientSize: schematicEffect.gradientSize,
        }
    }
}
