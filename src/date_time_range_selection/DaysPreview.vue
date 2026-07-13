<!-- 
  This vue component shows a list of days in a compact form
  for two or fewer days, show the 3-letter day with a "/".
  fot more, just use a single letter with a forward slash "/"
  use Su, Sa, Th for short versions of those days when only one
  either Sun/Sat or Th/Tu are used. keep them in order
-->
<template>
  <div class="dtrs-list-days-preview">
  <span v-if="days.length < 7">
    <span v-for="(day, index) in sortedDays" :key="day">
      {{ DAYS[day].short }}<span v-if="index < days.length - 1">/</span>
    </span>
  </span>
  <span v-else>
    (All)
  </span>
</div>
</template>

<style>
.dtrs-list-days-preview {
  opacity: 0.75;
}
</style>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/naming-convention */

import { computed, withDefaults } from 'vue';
const DAYS = {
  'Sunday' : {full: 'Sunday', three: 'Sun', short: 'Su', one: 'S'},
  'Monday' : {full: 'Monday', three: 'Mon', short: 'M', one: 'M'},
  'Tuesday' : {full: 'Tuesday', three: 'Tue', short: 'Tu', one: 'T'},
  'Wednesday' : {full: 'Wednesday', three: 'Wed', short: 'W', one: 'W'},
  'Thursday' : {full: 'Thursday', three: 'Thu', short: 'Th', one: 'R'},
  'Friday' : {full: 'Friday', three: 'Fri', short: 'F', one: 'F'},
  'Saturday' : {full: 'Saturday', three: 'Sat', short: 'Sa', one: 'S'},
} as const;

interface Props {
  days: string[];
}

const props = withDefaults(defineProps<Props>(), {
  days: () => [],
});

const sortedDays = computed(() => {
  const dayOrder = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return props.days.slice().sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
});

const _mode = computed<'full' | 'three' | 'short' | 'one'>(() => {
  switch (props.days.length) {
  case 0:
  case 1:
    return 'full';
  case 2:
    return 'three';
  case 3:
  case 4:
  case 5:
    return 'short';
  default:
    return 'one';
  }
});
</script>