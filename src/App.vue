<template>
  <div>
    <Chart :points="points" xAxisLabel="Time" yAxisLabel="Value" xUnit="s" yUnit="mV" 
    :customYTicks="{
      log: getTickLabelListLog(yMin, yMax).map(p => Math.log10(p)),
      linear: getTickLabelList(yMin, yMax)
    }"
    :customXTicks="{
      log: getTickLabelListLog(xMin, xMax),
      linear: getTickLabelList(xMin, xMax)
    }"/>
  </div>
</template>

<script setup lang="ts">
import Chart from './components/Chart.vue'

import { getTickLabelList, getTickLabelListLog } from './functions/getTickLabelList'
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

const linNums = linspace(0, 1, 1000);

const result = linNums.map(n => ekvNmos(unit(n, 'V')))

interface Point {
  x: number;
  y: number;
}
const points: Point[] = []
for (let i = 0; i < result.length; i++) {
  points.push({
    x: linNums[i],
    y: result[i].toNumber('A')
  })
}

const xValues = points.map(p => p.x)
const yValues = points.map(p => p.y)
const xMin = Math.min(...xValues)
const xMax = Math.max(...xValues)
const yMin = Math.min(...yValues)
const yMax = Math.max(...yValues)


</script>
