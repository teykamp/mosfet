<template>
  <div>
    <Diagram />
    <Tutorial v-if="firstTimeLoad" :data="tutorialData[tutorialStep]" :setTutorialStep="setTutorialStep" />
    <button
      @click="resetTutorial"
      style="position: absolute; bottom: 5px; left: 5px;"
    >?</button>
  </div>
</template>

<script setup lang="ts">
import Diagram from './components/Diagram.vue'
import Tutorial from './components/Tutorial.vue'
import { ref } from 'vue'
import { tutorialData } from './tutorialData'

const tutorialStep = ref(1)

const setTutorialStep = (skip: boolean = false) => {
  if (skip) {
    tutorialStep.value = tutorialData.length
  }
  else {
    tutorialStep.value++
  }

  if (tutorialStep.value > tutorialData.length - 1) {
    tutorialStep.value = 0
  }
  if (tutorialData[tutorialStep.value].reaction) {
    tutorialData[tutorialStep.value].reaction!()
  }
}

const isFirstTimeLoad = (): boolean => {
  const localStorageKey = 'firstTimeLoad'
  const firstTime = localStorage.getItem(localStorageKey) === null

  if (firstTime) {
    localStorage.setItem(localStorageKey, 'false')
  }

  return firstTime
}

const firstTimeLoad = ref(isFirstTimeLoad())

const resetTutorial = () => {
  firstTimeLoad.value = true
  tutorialStep.value = 0
  setTutorialStep()
  tutorialStep.value = 1
}

document.body.onmousedown = function(e) {
  if(e.button == 1) {
    e.preventDefault()
    return false
  }
}
</script>
