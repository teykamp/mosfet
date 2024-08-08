<template>
  <div>
    <Diagram />
    <Switch v-model="test" :label-up="'HIhihi'" :label-down="'hohoHOho'"/>
    {{ test }}
  </div>
</template>

<script setup lang="ts">
import Diagram from './components/Diagram.vue'
import Switch from './components/Switch.vue'
import { ref } from 'vue'

const test = ref(false)
</script>
