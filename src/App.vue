<template>
  <div>
    <Diagram />
    <Switch v-model="test" :label-up="'HIhihi'" :label-down="'hohoHOho'" :option="'test option'" />
  </div>
</template>

<script setup lang="ts">
import Diagram from './components/Diagram.vue'
import Switch from './components/Switch.vue'

import { ref } from 'vue'

const test = ref(true)

document.body.onmousedown = function(e) {
    if(e.button == 1) {
        e.preventDefault();
        return false;
    }
}
</script>
