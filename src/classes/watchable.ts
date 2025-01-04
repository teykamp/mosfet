import { Ref, ref } from "vue";

/**
    Base class for any typescript class that needs to be reactive to work with Vue 3's `watch` syntax.

    To use:
    ```ts
    class Container extends Watchable {
        importantValue: number = 3
    }

    const container = new Container()

    watch([() => container.importantValue, () => container.updated.value], ([imporantValue, _]) => {
        // do something with importantValue
    })
    ```
*/
export class Watchable {
    updated: Ref<boolean> = ref(false)

    react() {
        this.updated.value = !this.updated.value
    }
}
