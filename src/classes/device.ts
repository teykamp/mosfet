import { Named, Point, canvasId } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { ref, Ref, watch } from 'vue'
import { getLineLength } from "../functions/drawFuncs"
import { TectonicPoint } from "./tectonicPlate"
import { HtmlSlider } from "./ctxSlider"

export class Device extends CtxArtist{
    order: number = 0
    isDuplicate: boolean = false
    mouseDownInsideSelectionArea = false
    showCharts: Ref<boolean> = ref(false) // mainly a placeholder variable to keep track of whether mosfet charts are visible. Used in determining the positions of tectonic plates. Any number of devices can be 'showCharts' at any given time.
    selected: Ref<boolean> = ref(false) // the device that currently has the focus after being clicked on most recently. Only one device ever has selected as true.
    selectionChanged: Ref<boolean> = ref(false)
    boundingBox: TectonicPoint[]

    constructor (parentTransformations: Ref<TransformationMatrix>[] = [], localTransformationMatrix: TransformationMatrix = new TransformationMatrix(), canvasId: canvasId = 'main') {
        super(parentTransformations, localTransformationMatrix, canvasId)
        this.boundingBox = [
            new TectonicPoint(this.transformations, {x: -120, y: 0}),
            new TectonicPoint(this.transformations, {x: 120, y: 0}),
            new TectonicPoint(this.transformations, {x: 0, y: -120}),
            new TectonicPoint(this.transformations, {x: 0, y: 120}),
        ]
        watch(this.selected, () => this.selectionChanged.value = true)
    }

    checkSelectionArea(mousePosition: Point): boolean {
        const transformedMousePos = this.transformationMatrix.inverse().transformPoint(mousePosition)
        const radius = 60
        return getLineLength({start: {x: 0, y: 0}, end: transformedMousePos}) < radius
    }

    drawSelectedHalo(ctx: CanvasRenderingContext2D) {
        if (this.selected.value && !this.isDuplicate) {
            const backgroundGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100)
            backgroundGradient.addColorStop(0, 'rgba(0, 0, 255, 0)')
            backgroundGradient.addColorStop(0.5, 'rgba(0, 0, 255, 0)')
            backgroundGradient.addColorStop(0.8, 'rgba(0, 0, 255, 0.2)')
            backgroundGradient.addColorStop(1, 'rgba(0, 0, 255, 0)')
            ctx.fillStyle = backgroundGradient
            ctx.arc(0, 0, 200, 0, 2 * Math.PI)
            ctx.fill()
        }
    }

    get htmlSliders(): HtmlSlider[] {
        console.error("Getter function device.htmlSliders is a virtual function.")
        return []
    }

    get namedHtmlSliders(): Named<HtmlSlider[]> {
        return {
            name: this.key,
            selectionChanged: this.selectionChanged,
            deviceSelected: this.selected,
            value: this.htmlSliders,
        }
    }
}
