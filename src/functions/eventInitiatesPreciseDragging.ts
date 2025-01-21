export const eventInitiatesPreciseDragging = (event: PointerEvent | KeyboardEvent): boolean => {
    if (event instanceof PointerEvent) {
        // return event.button == 1
        return event.ctrlKey || event.shiftKey || event.altKey
    } else if (event instanceof KeyboardEvent) {
        return event.ctrlKey || event.shiftKey || event.altKey
    } else {
        console.error("Error: eventInitiatesPreciseDragging requires a PointerEvent or a KeyboardEvent.")
        return false
    }
}
