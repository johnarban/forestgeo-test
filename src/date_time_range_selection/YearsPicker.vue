<template>
  <div :class="{'dtrs-error-highlight': showErrorForEmpty && empty, 'dtrs-years-picker': true}">
    <label class="text-subtitle-2 mb-2 d-block">Years 
      <span v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;">
        (Select at least 1)
      </span>
      </label>
    <div v-for="year in possibleYears" :key="year" class="d-inline-block">
      <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-year-${year}`">
        <input 
          :id="`dtrs-year-${year}`"
          type="checkbox" 
          :value="year" 
          v-model="selectedYears" 
        />
        <span class="ml-1">{{ year }} </span>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
const { possibleYears } = defineProps<{
  possibleYears: number[];
  showErrorForEmpty?: boolean;
}>();

const selectedYears = defineModel<number[]>({
  type: Array as () => number[]
});

const empty = computed(() => selectedYears.value?.length === 0);
</script>

<style scoped>
.dtrs-years-picker {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px;
  
}
.dtrs-error-highlight {
  box-shadow: inset 0 0 8px 0px rgba(255,0,0,0.82)
}
</style>