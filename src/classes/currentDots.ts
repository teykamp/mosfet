import { drawCirclesFillWithGradient, getPathLength, getPointAlongPath } from "../functions/drawFuncs";
import { modulo } from "../functions/extraMath";
import { Circle, Line, Point } from "../types";

export class CurrentDots {
    dotPath: Line[]
    dotPercentage: number
    previousTimestamp: number
    dotSize: number
    dotSpacing: number
    gradientSize: number

    constructor(dotPath: Line[] = []) {
        this.dotPath = dotPath
        this.dotPercentage = 0
        this.previousTimestamp = 0
        this.dotSize = 8
        this.dotSpacing = 20
        if (dotPath.length == 0) {
            this.gradientSize = 0
        } else {
            this.gradientSize = Math.sqrt((dotPath[dotPath.length - 1].end.x - dotPath[0].start.x) ** 2 + (dotPath[dotPath.length - 1].end.y - dotPath[0].start.y) ** 2) / 2
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const dots: Circle[] = this.getMovingDotPositions(this.dotPath, this.dotSpacing).map((dotPosition: Point) => {
            return {center: dotPosition, outerDiameter: this.dotSize}
        })
        const currentGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.gradientSize)
        currentGradient.addColorStop(0, 'rgba(0, 0, 255, 1)')
        currentGradient.addColorStop(1, 'rgba(0, 0, 255, 0)')
        drawCirclesFillWithGradient(ctx, dots, this.dotSize / 2, currentGradient)
    }

    updateDotPositionBasedOnTimestamp(timestamp: number, current: number) {
        const timeDifference = timestamp - this.previousTimestamp
        this.previousTimestamp = timestamp
        const dotSpeed = this.getDotSpeedFromCurrent(current)
        this.dotPercentage = modulo(this.dotPercentage + dotSpeed * (timeDifference / 1000), 1)
    }

    private getMovingDotPositions(pathLines: Line[], spacingBetweenDots: number): Point[] {
        const pathLength = getPathLength(pathLines)

        const dotPositions: Point[] = []
        const nDots = Math.floor(pathLength / spacingBetweenDots)
        for (let n = 0; n < nDots; n++) {
            const thisDotPercentage = (n + this.dotPercentage) / nDots
            const dotPosition = getPointAlongPath(pathLines, thisDotPercentage)
            dotPositions.push(dotPosition)
        }
        return dotPositions
    }

    private getDotSpeedFromCurrent(current: number): number {
        // 10 mA -> speed of 3
        // 1 mA -> speed of 2
        // 100 uA -> speed of 1 // unityCurrent
        // 10 uA -> speed of 1/4
        // 1 uA -> speed of 1/9
        // 100nA -> speed of 1/16

        const unityCurrent = 1e-4 // Amps
        const unitySpeed = 1 // (100 percent) / s
        let dotSpeed = unitySpeed
        let negativeCurrent = false

        if (current == 0) {
            return 0
        }
        if (current < 0) {
            current = Math.abs(current)
            negativeCurrent = true
        }
        if (current > unityCurrent) {
            dotSpeed = (Math.log10(current / unityCurrent) + 1) ** 2 * unitySpeed
        } else {
            dotSpeed = 1 / (1 - Math.log10(current / unityCurrent)) ** 2 * unitySpeed
        }
        if (dotSpeed > 5 * unitySpeed) {
            dotSpeed = 5 * unitySpeed
        }
        else if (dotSpeed < 0.001 * unitySpeed) {
            dotSpeed = 0.001 * unitySpeed
        }

        return negativeCurrent ? -dotSpeed : dotSpeed
    }
}
