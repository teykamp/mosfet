<template>
  <div>
    <Chart :points="currents" xAxisLabel="Vgs" yAxisLabel="Current" xUnit="V" yUnit="A" v-bind:cornerToCornerGraph="true"/>
    <Chart :points="saturationLevels" xAxisLabel="Vds" yAxisLabel="% of Max. Current" xUnit="V" yUnit="%" v-bind:cornerToCornerGraph="true"/>
    <Diagram />
  </div>
</template>

<script setup lang="ts">
import Chart from './components/Chart.vue'
import Diagram from './components/Diagram.vue'

import { ekvNmos } from './functions/ekvModel'
import { unit } from 'mathjs'

function linspace(start: number, end: number, num: number): number[] {
  if (num <= 0) {
    throw new Error("num must be a positive integer");
  }
  if (num === 1) {
    return [start];
  }

  const step = (end - start) / (num - 1);
  const result: number[] = [];

  for (let i = 0; i < num; i++) {
    result.push(start + step * i);
  }

  return result;
}

interface Point {
  x: number;
  y: number;
}

// current
const currents: Point[] = []
const Vgs = linspace(0, 1, 1000);
const current = Vgs.map(n => ekvNmos(unit(n, 'V'), unit(0, 'V')).I)
for (let i = 0; i < current.length; i++) {
  currents.push({
    x: Vgs[i],
    y: current[i].toNumber('A')
  })
}

// saturation level
const saturationLevels: Point[] = []
const Vds = linspace(0, 1, 1000);
const saturationLevel = Vds.map(n => ekvNmos(unit(1, 'V'), unit(0, 'V'), unit(n, 'V')).saturationLevel * 100) // to percent
for (let i = 0; i < current.length; i++) {
  saturationLevels.push({
    x: Vgs[i],
    y: saturationLevel[i]
  })
}

</script>
