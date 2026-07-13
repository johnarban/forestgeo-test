<template>
  <div class="mb-4 simple-patterns">
    <!-- winter, spring, summer, fall -->
    <v-btn 
      v-if="seasons"
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = ['December', 'January', 'February']"
    >Winter</v-btn>
    <v-btn 
      v-if="seasons"
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = ['March', 'April', 'May']"
    >Spring</v-btn>
    <v-btn 
      v-if="seasons"
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = ['June', 'July', 'August']"
    >Summer</v-btn>
    <v-btn 
      v-if="seasons"
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = ['September', 'October', 'November']"
    >Fall</v-btn>
    <!-- all -->
    <v-btn 
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = MONTHS.slice()"
    >All Months</v-btn>
    <!-- clear -->
    <v-btn 
      size="x-small" 
      variant="outlined" 
      class="mr-2 mb-2"
      @click="selectedMonths = []"
    >Clear Months</v-btn>
  </div>
</template>

<script lang="ts" setup>
import { type MonthType, MONTHS } from './date_time_range_generators';
const selectedMonths = defineModel<MonthType[]>({
  type: Array as () => MonthType[]
});
defineProps<{
  seasons?: boolean;
}>();
</script>
