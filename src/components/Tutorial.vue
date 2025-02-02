<template>
  <div v-if="props.data.title !== ''">
    <div :style="`background-color: #FF7F7F; border-radius: 10px; border: 2px solid red; position: absolute; max-width: 400px; padding: 20px; ${props.data.location ? props.data.location.y : 'top: 45vh'}; ${props.data.location ? props.data.location.x : 'left: calc(50vw - 200px'}); box-shadow: rgba(0, 0, 0, 0.4) 0px 8px 24px;`">
      <h3 style="color: white;">{{ props.data.title }}</h3>
      <div style="color: white;" v-html="props.data.text"></div>
      <!-- <p style="color: white;">{{ props.data.text }}</p> -->
      <div style="display: flex; justify-content: space-around;">
        <button @click="setTutorialStep()">Ok</button>
        <button @click="setTutorialStep(true)">Skip</button>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { TutorialData } from '../types';

const props = defineProps<{
  setTutorialStep: (skip?: boolean) => void,
  data: TutorialData,
}>()

</script>
