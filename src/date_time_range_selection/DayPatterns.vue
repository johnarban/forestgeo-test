<template>
<div class="mb-4 simple-patterns">
  <!-- weekdays -->
  <v-btn 
    size="x-small" 
    variant="outlined" 
    class="mr-2 mb-2"
    @click="selectedDays = ['Monday','Tuesday','Wednesday','Thursday','Friday']"
  >Weekdays</v-btn>
  <!-- weekends -->
  <v-btn 
    size="x-small" 
    variant="outlined" 
    class="mr-2 mb-2"
    @click="selectedDays = ['Sunday','Saturday']"
  >Weekends</v-btn>
  <!--
  <v-btn 
    size="x-small" 
    variant="outlined" 
    class="mr-2 mb-2"
    @click="selectedDays = DAYS.slice()"
  >Full Week</v-btn>
  <v-btn 
    size="x-small" 
    variant="outlined" 
    class="mr-2 mb-2"
    @click="selectedDays = []"
  >Clear</v-btn>
  -->
</div>

</template>

<script lang="ts" setup>
import { type DayType } from './date_time_range_generators';
const selectedDays = defineModel<DayType[]>({
  type: Array as () => DayType[]
});
</script>