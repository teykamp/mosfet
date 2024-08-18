<template>
  <div>
    <Diagram />
    <Switch v-model="test2" :label-up="'on'" :label-down="'off'" :option="'test option'" />
    {{test2}}
  </div>
</template>

<script setup lang="ts">
import Diagram from './components/Diagram.vue'
import Switch from './components/Switch.vue'

import { ref } from 'vue'

const test = ref(true)
const test2 = ref<'on' | 'off'>('on')

document.body.onmousedown = function(e) {
    if(e.button == 1) {
        e.preventDefault();
        return false;
    }
}
</script>
