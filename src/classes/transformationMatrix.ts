import { Matrix } from 'ts-matrix'
import { Point, Line } from '../types'
import { assert } from 'console'

export class TransformationMatrix {
    // [
    //  scaleX * cos(angle), scaleY * -sin(angle), translate.x
    //  scaleX * sin(angle), scaleY *  cos(angle), translate.y
    //  0                  , 0                   , 1
    // ]
    matrix: Matrix

    constructor() {
        this.matrix = new Matrix(3, 3, [[1, 0, 0], [0, 1, 0], [0, 0, 1]])
    }

    get scaleX(): number {
        return Math.sqrt((this.matrix.at(0, 0) ** 2 + this.matrix.at(1, 0) ** 2))
    }

    get scaleY(): number {
        return Math.sqrt((this.matrix.at(0, 1) ** 2 + this.matrix.at(1, 1) ** 2))
    }

    get relativeScale(): number {
        return Math.abs(Math.sqrt(this.matrix.determinant()))
    }

    get rotation(): number {
        return Math.atan2(-1 * this.matrix.at(0, 1) * this.matrix.at(1, 0), this.matrix.at(0, 0) * this.matrix.at(1, 1))
    }

    get isMirrored(): boolean {
        return Math.sqrt(this.matrix.determinant()) < 0
    }

    get translation(): Point {
        return {
            x: this.matrix.at(0, 2),
            y: this.matrix.at(1, 2),
        }
    }

    set scaleX(x: number) {
        assert(x != 0)
        this.scale(1 / this.scaleX, 1, true)
        this.scale(x, 1, true)
    }

    set scaleY(y: number) {
        assert(y != 0)
        this.scale(1, 1 / this.scaleY, true)
        this.scale(1, y, true)
    }

    set relativeScale(scale: number) {
        assert(scale != 0)
        this.scale(1 / this.relativeScale, 1 / this.relativeScale, true)
        this.scale(scale, scale, true)
    }

    set rotation(angle: number) {
        this.rotate(-this.rotation, true)
        this.rotate(angle, true)
    }

    set isMirrored(mirrored) {
        if (this.isMirrored != mirrored) {
            // this.rotate(-this.rotation, true)
            this.mirror(true, false, true)
            // this.rotate(this.rotation, true)
        }
    }

    rotate(angle: number, inPlace: boolean = false): TransformationMatrix {
        const result = new TransformationMatrix()
        Object.assign(result, this)

        result.matrix = this.matrix.multiply(
            new Matrix(3, 3, [
                [Math.cos(angle), -Math.sin(angle), 0],
                [Math.sin(angle),  Math.cos(angle), 0],
                [0              , 0               , 1]
            ])
        )
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    translate(coordinates: Point, inPlace: boolean = false): TransformationMatrix {
        const result = new TransformationMatrix()
        Object.assign(result, this)

        result.matrix = this.matrix.multiply(
            new Matrix(3, 3, [
                [1, 0, coordinates.x],
                [0, 1, coordinates.y],
                [0, 0, 1]
            ])
        )
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    mirror(x: boolean, y: boolean = false, inPlace: boolean = false): TransformationMatrix {
        const result = new TransformationMatrix()
        Object.assign(result, this)

        const xMirror = x ? 1 : -1
        const yMirror = y ? 1 : -1

        result.matrix = this.matrix.multiply(
            new Matrix(3, 3, [
                [xMirror, yMirror, 0],
                [xMirror, yMirror, 0],
                [0, 0,       1]
            ])
        )
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    scale(x: number, y: number = x, inPlace: boolean = false) {
        const result = new TransformationMatrix()
        Object.assign(result, this)

        result.matrix = this.matrix.multiply(
            new Matrix(3, 3, [
                [x, y, 0],
                [x, y, 0],
                [0, 0, 1]
            ])
        )
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    inverse(inPlace: boolean = false) {
        const result = new TransformationMatrix()
        Object.assign(result, this)
        result.matrix = result.matrix.inverse()
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    multiply(rightTransformationMatrix: TransformationMatrix, inPlace: boolean = false): TransformationMatrix {
        const result = new TransformationMatrix()
        Object.assign(result, this)
        result.matrix = result.matrix.multiply(rightTransformationMatrix.matrix)
        if (inPlace) {
            Object.assign(this, result)
            return result
        }
        else {
            return result
        }
    }

    // apply the transformation matrix to the entire canvas
    transformCanvas(ctx: CanvasRenderingContext2D, resetFirst: boolean = true) {
        if (resetFirst) {
            ctx.setTransform(this.matrix.at(0, 0), this.matrix.at(1, 0), this.matrix.at(0, 1), this.matrix.at(1, 1), this.matrix.at(0, 2), this.matrix.at(1, 2))
        } else {
            ctx.transform(   this.matrix.at(0, 0), this.matrix.at(1, 0), this.matrix.at(0, 1), this.matrix.at(1, 1), this.matrix.at(0, 2), this.matrix.at(1, 2))
        }
    }

    transformPoint(point: Point): Point {
        const transformedVector = this.matrix.multiply(new Matrix(3, 1, [[point.x], [point.y], [1]]))
        return {
            x: transformedVector.at(0, 0),
            y: transformedVector.at(1, 0),
        }
    }

    transformLine(line: Line): Line {
        return {
            start: this.transformPoint(line.start),
            end:   this.transformPoint(line.end),
        }
    }

    transformPath(pathLines: Line[]): Line[] {
        return pathLines.map((line: Line) => this.transformLine(line))
    }
}
