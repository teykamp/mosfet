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
    background-color: blue;
    padding: 5px;
    width: max-content;
}

.menuOption {
    background-color: lightgray;
    border: 1px solid black;
    display: block;
}

.hovered {
    background-color: red;
}

.preventSelect {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}

</style>
