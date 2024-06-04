<template>
  <div>
    <Chart :points="points" xAxisLabel="Time" yAxisLabel="Value" xUnit="s" yUnit="mV" />
  </div>
</template>

<script setup lang="ts">
import Chart from './components/Chart.vue'

const points = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 3 },
  { x: 4, y: 4 },
]
</script>
