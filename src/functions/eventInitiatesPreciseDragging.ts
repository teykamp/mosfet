export const eventInitiatesPreciseDragging = (event: PointerEvent): boolean => {
    // return event.button == 1
    return event.ctrlKey
}
