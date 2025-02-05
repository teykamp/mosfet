<template>
    <div class="menu">
        <div style="display: flex" v-for="option, index in menuOptions">
            <div :class="{menuOption: true, preventSelect: true, hovered: hoveredIndex == index}"
                @click="option.action"
                @pointerover="() => {hoveredIndex = index}"
                @pointerleave="() => {hoveredIndex = -1}"
            > {{ option.name }} </div>
        </div>
    </div>
</template>

<script setup lang='ts' generic="T">
    import { ref } from 'vue';
import { contextMenuOption } from '../types';

    defineProps<{
        menuOptions: contextMenuOption[]
    }>()

    const hoveredIndex = ref(-1)

</script>

<style scoped>

.menu {
    background-color: whitesmoke;
    padding: 4px;
    border-radius: 5px;
    width: max-content;
}

.menuOption {
    background-color: lightgray;
    padding: 5px;
    border-radius: 5px;
    display: block;
}

.hovered {
    background-color: rgb(180, 180, 180);
}

.preventSelect {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}

</style>
