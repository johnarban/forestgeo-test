<template>
  <div class="census-status-filter">
    <span class="census-status-label">Trees</span>
    <v-btn-toggle
      v-model="status"
      mandatory
      density="compact"
      variant="outlined"
      divided
      color="primary"
    >
      <v-btn v-for="opt in OPTIONS" :key="opt.value" :value="opt.value" size="small">
        {{ opt.title }}
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTempoStore, type CensusStatus, type Site } from "@/stores/app";

// Live / dead / all filter for one site's census trees (points + density).
// Status is from the site's latest census.

const props = defineProps<{ site: Site }>();
const store = useTempoStore();

const OPTIONS: { title: string; value: CensusStatus }[] = [
  { title: "Live", value: "live" },
  { title: "Dead", value: "dead" },
  { title: "All", value: "all" },
];

const status = computed({
  get: () => store.censusStatus[props.site],
  set: (v: CensusStatus) => { store.censusStatus[props.site] = v; },
});
</script>

<style scoped lang="less">
.census-status-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.census-status-label {
  font-size: 10pt;
}
</style>
