import { Visibility, SchematicEffect, Node } from "../types"
import { CtxArtist } from "./ctxArtist"
import { TransformationMatrix } from "./transformationMatrix"
import { AngleSlider } from "./angleSlider"
import { Ref } from 'vue'
import { unit, Unit } from "mathjs"
import { ekvNmos, ekvPmos } from "../functions/ekvModel"
import { toRadians } from "../functions/extraMath"

export class Mosfet extends CtxArtist{
    mosfetType: 'nmos' | 'pmos'
    mirror: boolean // obsolete
    dotPercentage: number
    gradientSize: number
    schematicEffects: {[name: string]: SchematicEffect}
    vgs: AngleSlider
    vds: AngleSlider
    Vg: Ref<Node>
    Vs: Ref<Node>
    Vd: Ref<Node>
    Vb: Ref<Node>
    current: number // in Amps
    saturationLevel: number // as a fraction of total saturation (0 to 1)
    forwardCurrent: number // in Amps

    constructor(parentTransformationMatrix: TransformationMatrix, mosfetType: 'nmos' | 'pmos', originX: number, originY: number, Vg: Ref<Node>, Vs: Ref<Node>, Vd: Ref<Node>, Vb: Ref<Node>, maxVgs: number = 3, maxVds: number = 5, mirror: boolean = false, vgsVisibility: Visibility = Visibility.Visible, vdsVisibility: Visibility = Visibility.Visible) {
        super(parentTransformationMatrix.translate({x: originX, y: originY}).scale(1/30).mirror(mirror, false))
        this.mosfetType = mosfetType
        this.mirror = mirror
        this.gradientSize = 100
        this.schematicEffects = {
            "gate": {
                node: Vg,
                origin: {
                x: 30,
                y: 0,
                },
                color: 'red',
                gradientSize: 2,
            },
            "saturation": {
                node: Vd,
                origin: {
                x: 0,
                y: 30 * (mosfetType == 'nmos' ? -1 : 1),
                },
                color: 'red',
                gradientSize: 100,
            },
        },
        this.dotPercentage = 0
        this.Vg = Vg
        this.Vs = Vs
        this.Vd = Vd
        this.Vb = Vb
        this.current = this.getMosfetCurrent()
        this.saturationLevel = this.getMosfetSaturationLevel()
        this.forwardCurrent = this.getMosfetForwardCurrent()

        if (this.mosfetType == 'nmos') {
            this.vgs = new AngleSlider(this.transformationMatrix, 10, 10, 60, toRadians(75), toRadians(70), true, 0, maxVgs, 'Vgs', vgsVisibility)
            this.vds = new AngleSlider(this.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, 0, maxVds, 'Vds', vdsVisibility)
        }
        else {
            this.vgs = new AngleSlider(this.transformationMatrix, 10, -10, 60, toRadians(-5), toRadians(70), true, -maxVgs, 0, 'Vsg', vgsVisibility, true)
            this.vds = new AngleSlider(this.transformationMatrix, 30, 0, 75, toRadians(140), toRadians(80), false, -maxVds, 0, 'Vsd', vdsVisibility, true)
        }
    }

    getMosfetEkvResult(): { I: Unit, saturationLevel: number, IF: Unit } {
        if (this.mosfetType == 'pmos') {
            return ekvPmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V'))
        }
        else {
            return ekvNmos(unit(this.Vg.value.voltage, 'V'), unit(this.Vs.value.voltage, 'V'), unit(this.Vd.value.voltage, 'V'), unit(this.Vb.value.voltage, 'V'))
        }
    }

    getMosfetCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.I.toNumber('A')
    }

    getMosfetSaturationLevel(): number {
        const result = this.getMosfetEkvResult()
        return result.saturationLevel
    }

    getMosfetForwardCurrent(): number {
        const result = this.getMosfetEkvResult()
        return result.IF.toNumber('A')
    }

}
