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

const tutorialData = [
  {
    title: '',
    text: ''
  },
  {
    title: 'Welcome to Mosfets',
    text: 'This will show you around the program.'
  },
  {
    title: 'Side Bar',
    text: 'These buttons allow you to switch circuits.',
    location: {
      x: 'left: 200px;',
      y: 'top: 50px;'
    }
  },
  {
    title: 'Circuits',
    text: 'Highlighted sliders allow you to manipulate the voltages on each voltage source. Move one to see how they work.',
    location: {
      x: 'right: 45vw;',
      y: 'top: 200px;'
    }
  },
  {
    title: 'Current',
    text: 'Blue dots move relative to the current flowing through the mosfet. Move the orange voltage sliders to see it change.',
    location: {
      x: 'right: 45vw;',
      y: 'top: 200px;'
    }
  },
]
const tutorialStep = ref(1)

const setTutorialStep = (skip: boolean = false) => {
  if (skip) tutorialStep.value = tutorialData.length
  else tutorialStep.value++
  if (tutorialStep.value > tutorialData.length - 1) tutorialStep.value = 0
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
  tutorialStep.value = 1
}

document.body.onmousedown = function(e) {
  if(e.button == 1) {
    e.preventDefault()
    return false
  }
}
</script>
