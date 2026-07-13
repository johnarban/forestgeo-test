<template>
  <div id="dtrs-months-picker" :class="{'dtrs-error-highlight': showErrorForEmpty && empty}">
    <div class="d-flex flex-wrap align-content-center">
      <label class="text-subtitle-2 mb-2 d-inline">Months
      </label>
      <div>
      <v-btn 
        size="x-small" 
        variant="outlined" 
        class="mr-2 mb-2 ml-4"
        @click="selectedMonths = []"
      >Clear
      <template #prepend>
        <v-icon icon="mdi-close-circle" color="error"/>
      </template>
    </v-btn>
      <v-btn 
        size="x-small" 
        variant="outlined" 
        class="mr-2 mb-2"
        @click="selectedMonths = MONTHS.slice()"
      >All
      <template #prepend>
        <v-icon icon="mdi-check-circle" color="success"/>
      </template>
    </v-btn>
      </div>
      <div v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;" class="mb-2">
        (Select at least 1)
      </div>
    </div>
    <fieldset 
      :style="cssVars" 
      :class="{'dtrs-months-block':true, 'dtrs-error-month': empty} ">
      <div v-for="month in MONTHS" :key="month">
        <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-month-${month}`">
          <input 
            :id="`dtrs-month-${month}`"
            type="checkbox" 
            :value="month" 
            v-model="selectedMonths" 
          />
          <span class="ml-1">{{ month }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { type MonthType, MONTHS } from './date_time_range_generators';

const { showErrorForEmpty } = defineProps<{
  showErrorForEmpty?: boolean;
}>();

const selectedMonths = defineModel<MonthType[]>({
  type: Array as () => MonthType[]
});

const empty = computed(() => selectedMonths.value?.length === 0);

const columns = ref(1);
const cssVars = computed(() => ({
  '--column-count': columns.value
}));
const observer = new ResizeObserver(() => {
  updateColumnCount();
});

const monthItemWidthPx = 110;
function updateColumnCount() {
  const container = document.getElementById('dtrs-months-picker') ;
  if (container) {
    columns.value = Math.max(Math.floor(container.clientWidth / monthItemWidthPx), 1);
  }
}
onMounted(() => {
  updateColumnCount();
  const container = document.getElementById('dtrs-months-picker') ;
  if (container) {
    observer.observe(container);
  }
});

onBeforeUnmount(() => {
  observer.disconnect();
});

</script>

<style scoped>

.dtrs-months-block {
  display: grid;
  grid-template-columns: repeat(var(--column-count), auto);
  border: none;
  margin-inline: -8px;
  padding-inline: 8px;
  border-radius: 4px;
}
#dtrs-months-picker {
  border-radius: 8px;
  padding: 8px 0px;
  margin: 4px;
  
}


fieldset.dtrs-months-block.dtrs-error-month {
  background-color: rgba(255,0,0,.2)
}

</style>
