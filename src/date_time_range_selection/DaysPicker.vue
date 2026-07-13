<template>
  <div id='dtrs-days-picker' :class="{'dtrs-error-highlight': showErrorForEmpty && empty}">
    <div class="d-flex flex-wrap align-content-center">
      <label class="text-subtitle-2 mb-2 d-block">Days of Week
        <span v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;">
          (Select at least 1)
        </span>
      </label>
      <div>
        <!-- clear -->
        <v-btn 
          size="x-small" 
          variant="outlined" 
          class="mr-2 mb-2 ml-4"
          @click="selectedDays = []"
        >
          Clear
          <template #prepend>
            <v-icon icon="mdi-close-circle" color="error"/>
          </template>
        </v-btn>
        
        <v-btn 
          size="x-small" 
          variant="outlined" 
          class="mr-2 mb-2"
          @click="selectedDays = DAYS.slice()"
        >
          All
          <template #prepend>
            <v-icon icon="mdi-check-circle" color="success"/>
          </template>
        </v-btn>
        
      </div>
    </div>
    <!-- just do labeled checkboxes -->
    <div :style="cssVars" id="dtrs-days-block">
    <label v-for="(day, idx) in DAYS" :key="idx" class="mr-3" style="text-wrap: nowrap;">
      <input 
        type="checkbox" 
        :value="day" 
        v-model="selectedDays" 
      />
      <span class="ml-1">{{ day.slice(0,3) }}</span>
    </label>
  </div>
  </div>
</template>


<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { type DayType, DAYS } from './date_time_range_generators';

const { showErrorForEmpty } = defineProps<{
  showErrorForEmpty?: boolean;
}>();

const selectedDays = defineModel<DayType[]>({
  type: Array as () => DayType[],
  default: () => [...DAYS],
});

const empty = computed(() => selectedDays.value?.length === 0);


const columns = ref(1);
const cssVars = computed(() => ({
  '--column-count': columns.value
}));
const observer = new ResizeObserver(() => {
  updateColumnCount();
});

const monthItemWidthPx = 60;
function updateColumnCount() {
  const container = document.getElementById('dtrs-days-picker') ;
  if (container) {
    columns.value = Math.max(Math.floor(container.clientWidth / monthItemWidthPx), 1);
  }
}
onMounted(() => {
  updateColumnCount();
  const container = document.getElementById('dtrs-days-picker') ;
  if (container) {
    observer.observe(container);
  }
});

onBeforeUnmount(() => {
  observer.disconnect();
});


</script>

<style scoped>

#dtrs-days-block {
  display: grid;
  grid-template-columns: repeat(var(--column-count), auto);
}

.dtrs-days-picker {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px;
  
}
.dtrs-error-highlight {
  box-shadow: inset 0 0 8px 0px rgba(255,0,0,0.82)
}
</style>