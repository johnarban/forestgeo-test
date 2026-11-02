<template>
  <div class="species-range-controls">
    <div class="panel-heading">
      <div class="panel-title">Native ranges</div>
      <div class="panel-subtitle">
        Show a species' native range from Little's Atlas of United States Trees.
      </div>
    </div>

    <div v-if="rangeItems.length === 0" class="empty-note">
      No species selected. Use the species filter under the map to choose some.
    </div>

    <template v-else>
      <div class="range-actions">
        <v-btn
          size="x-small"
          variant="text"
          :disabled="allShown"
          @click="showAll"
        >Show all</v-btn>
        <v-btn
          size="x-small"
          variant="text"
          :disabled="rangeSpecies.length === 0"
          @click="hideAll"
        >Hide all</v-btn>
      </div>

      <v-list density="compact" class="range-list" bg-color="transparent">
        <v-list-item
          v-for="item in rangeItems"
          :key="item.sp"
          class="range-item"
          @click="item.hasRange && toggle(item.sp)"
        >
          <template #prepend>
            <v-checkbox-btn
              :model-value="rangeSpecies.includes(item.sp)"
              :disabled="!item.hasRange"
              density="compact"
              hide-details
              @click.stop="toggle(item.sp)"
            />
            <span class="genus-swatch" :style="{ backgroundColor: item.color }"></span>
          </template>

          <v-list-item-title class="range-title">{{ item.common }}</v-list-item-title>
          <v-list-item-subtitle class="range-subtitle">
            <em>{{ item.latin }}</em>
            <span v-if="!item.hasRange"> — no range data</span>
          </v-list-item-subtitle>

          <template #append>
            <v-progress-circular
              v-if="rangeLoading.includes(item.sp)"
              indeterminate
              size="16"
              width="2"
              color="var(--info-background)"
            />
          </template>
        </v-list-item>
      </v-list>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";

import { useTempoStore } from "@/stores/app";
import { SP_INFO, GENUS_COLORS, GENUS_FALLBACK } from "@/datasets/addDendrobands";
import { speciesHasRange } from "@/datasets/addTreeRanges";

const store = useTempoStore();
const { selectedSpecies, rangeSpecies, rangeLoading } = storeToRefs(store);

// Drive the list off the species filter so the two stay in sync. Species with
// a native-range file are listed first, then any without (shown disabled).
const rangeItems = computed(() =>
  selectedSpecies.value
    .map((sp) => {
      const info = SP_INFO[sp];
      const genus = info?.genus;
      return {
        sp,
        common: info?.common ?? sp,
        latin: info?.latin ?? "",
        color: (genus && GENUS_COLORS[genus]) || GENUS_FALLBACK,
        hasRange: speciesHasRange(sp),
      };
    })
    .sort((a, b) => Number(b.hasRange) - Number(a.hasRange) || a.common.localeCompare(b.common))
);

const withRange = computed(() => rangeItems.value.filter((i) => i.hasRange).map((i) => i.sp));
const allShown = computed(() =>
  withRange.value.length > 0 && withRange.value.every((sp) => rangeSpecies.value.includes(sp))
);

function toggle(sp: string) {
  if (!speciesHasRange(sp)) { return; }
  rangeSpecies.value = rangeSpecies.value.includes(sp)
    ? rangeSpecies.value.filter((s) => s !== sp)
    : [...rangeSpecies.value, sp];
}

function showAll() {
  rangeSpecies.value = [...withRange.value];
}

function hideAll() {
  rangeSpecies.value = [];
}
</script>

<style scoped lang="less">
.species-range-controls {
  padding: 12px 10px;

  .panel-heading {
    margin-bottom: 8px;
  }

  .panel-title {
    font-weight: 700;
    font-size: 1rem;
  }

  .panel-subtitle {
    font-size: 0.75rem;
    opacity: 0.75;
    margin-top: 2px;
  }

  .empty-note {
    font-size: 0.8rem;
    opacity: 0.7;
    padding: 8px 4px;
  }

  .range-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .range-item {
    padding-inline-start: 4px;
  }

  .genus-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 0.5px solid #333;
    margin-inline: 4px 8px;
    flex-shrink: 0;
  }

  .range-title {
    font-size: 0.85rem;
  }

  .range-subtitle {
    font-size: 0.72rem;
  }
}
</style>
