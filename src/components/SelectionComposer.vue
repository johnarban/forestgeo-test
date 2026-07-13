<template>
  <v-card id="selection-composer">
    <v-card-title class="d-flex justify-space-between">
      <v-chip size="x-small" color="primary" variant="tonal">{{ creationProgress.count }}/3</v-chip>
    </v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <!-- Region Picker -->
      <v-select
        :items="regions.map(r => ({ title: r.name, value: r }))"
        :model-value="draftUserDataset.region"
        @update:model-value="setDraftSelectionRegion($event as RectangleSelectionType)"
        label="Region"
        :disabled="disabled?.region"
        item-title="title"
        item-value="value"
        density="compact"
        hide-details
        variant="outlined"
        bg-color="background"
      />


      <!-- Time Range Picker: offer Effective (current day/custom) and any active custom ranges -->
      <v-select
        :items="timeRanges"
        v-model="selectedTimeRange"
        label="Time Range"
        :disabled="disabled?.timeRange"
        density="compact"
        hide-details
        variant="outlined"
        return-object
        bg-color="background"
      >
        <template #item="{ index, props }">
          <v-list-item v-bind="{ ...props, title: (props.value as any).name }">
            <template #title></template>
            <template #default>
              <v-list-item-title>{{ timeRanges[index].name }}</v-list-item-title>
              <v-list-item-subtitle
                v-if="timeRanges[index].name === 'Displayed Day'"
              >
                {{ new Date((timeRanges[index].range as MillisecondRange).start).toDateString() }}
              </v-list-item-subtitle>
            </template>
          </v-list-item>
        </template>
        <template #selection>
          {{ selectedTimeRange?.name || 'Select Time Range' }}
        </template>
      </v-select>

      <!-- Molecule Picker -->
      <v-select
        :items="availableMolecules.map(m => ({ title: m.title, value: m.key }))"
        :model-value="draftUserDataset.molecule"
        @update:model-value="setDraftSelectionMolecule($event)"
        label="Molecule"
        :disabled="disabled?.molecule"
        :hint="moleculeHint"
        :persistent-hint="!!moleculeHint"
        item-title="title"
        item-value="value"
        density="compact"
        variant="outlined"
        bg-color="background"
      />

      <v-progress-linear :model-value="creationProgress.percent" height="6" color="primary" rounded></v-progress-linear>

      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          :disabled="creationProgress.count < 3"
          @click="composeSelection"
          size="small"
          :loading="loading"
        >
          <template #loader>
            <v-progress-linear
              indeterminate
            ></v-progress-linear>
          </template>
          Access Data
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          @click="reset"
        >
          Reset
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { v4 } from "uuid";

import type { MappingBackends, RectangleSelection, TimeRange, UserDataset } from "../types";
import type { MillisecondRange } from "../types/datetime";
import { type MoleculeType, MOLECULE_OPTIONS } from "../esri/utils";

const selectedTimeRange = ref<TimeRange | null>(null);

interface SelectionComposerProps {
  backend: MappingBackends;
  timeRanges: TimeRange[];
  regions: RectangleSelectionType[];
  moleculeReady?: Map<string, boolean[] | undefined>;
  disabled?: { region?: boolean; timeRange?: boolean; molecule?: boolean };
}

const props = defineProps<SelectionComposerProps>();

const emit = defineEmits<{
  (event: "create", selection: UserDataset): void;
}>();

const loading = ref(false);

type RectangleSelectionType = RectangleSelection;

interface DraftUserDataset {
  region?: RectangleSelectionType | null;
  timeRange?: TimeRange | null;
  molecule?: MoleculeType | null;
}
const draftUserDataset = ref<DraftUserDataset>({ region: null, timeRange: null, molecule: null });
const availableMolecules = computed(() => MOLECULE_OPTIONS.map(o => ({ key: o.value as MoleculeType, title: o.title })));

const moleculeHint = computed(() => {
  if (!props.moleculeReady) return '';
  let msg = '';
  for (const kv of props.moleculeReady) {
    if (kv[1] && !kv[1].every(v => !!v)) {
      msg += MOLECULE_OPTIONS.find(m => m.value === kv[0])?.title || kv[0] + ' ';
    }
  }
  if (msg === '') return '';
  return `Due to service interruptions, some data may be unvailable for the following molecule(s): ${msg}`;
});

// Public composition progress
const creationProgress = computed(() => {
  let count = 0;
  if (draftUserDataset.value.region) count += 1;
  if (draftUserDataset.value.timeRange) count += 1;
  if (draftUserDataset.value.molecule) count += 1;
  return { count, percent: (count / 3) * 100 };
});

function setDraftSelectionRegion(region: RectangleSelectionType | null) {
  (draftUserDataset.value.region as RectangleSelectionType | null) = region || null;
}

function setDraftSelectionMolecule(molecule: MoleculeType | null) {
  draftUserDataset.value.molecule = molecule || null;
}

function setDraftSelectionTimeRange(range: TimeRange | null) {
  draftUserDataset.value.timeRange = range || null;
}

async function composeSelection(): Promise<UserDataset | null> {
  // const color = COLORS[selectionCount % COLORS.length]; // we will use the color from the region
  
  const draft = draftUserDataset.value;
  if (!draft.region || !draft.timeRange || !draft.molecule) {
    console.error('Draft selection incomplete');
    return null;
  }
  
  const sel: UserDataset = {
    id: v4(),
    region: draft.region, // as { id: string; name: string; rectangle: RectangleSelectionInfo; color: string; layer?: unknown },
    timeRange: draft.timeRange,
    molecule: draft.molecule as MoleculeType,
  };
  emit("create", sel);
  return sel;
}


function reset() {
  draftUserDataset.value = { region: null, timeRange: null, molecule: null };
  selectedTimeRange.value = null;
}

watch(selectedTimeRange, (timeRange: TimeRange | null) => {
  setDraftSelectionTimeRange(timeRange ?? null);
});

// just watch the id's. using a 'deep' watch caused a significant performance hit
watch(() => props.regions.map(r => r.id), (newRegions) => {
  if (draftUserDataset.value.region) {
    const exists = newRegions.find(rid => rid === draftUserDataset.value.region?.id);
    if (!exists) {
      draftUserDataset.value.region = null;
    }
  }
});
</script>

<style>
#selection-composer  .v-progress-linear {
  width: 80%;
}

/* the lists are actually attached to the somewhere else in the DOM */
.v-list[aria-label="Time Range-list"] {
  background-color: rgb(var(--v-theme-background)) !important;
  /* color: rgb(var(--v-theme-on-surface-light)); */
  /* border: 2px solid currentColor; */
  border-top-width: 1px;
}

.v-list[aria-label="Molecule-list"] {
  background-color: rgb(var(--v-theme-background)) !important;
  /* color: rgb(var(--v-theme-on-surface-light)); */
  /* border: 1px solid currentColor; */
}

.v-list[aria-label="Region-list"] {
  background-color: rgb(var(--v-theme-background)) !important;
  /* color: rgb(var(--v-theme-on-surface-light)); */
  /* border: 1px solid currentColor; */
}


/* selectors */

#selection-composer .v-select--active-menu .v-field.v-field--focused .v-field__outline {
  /* border-bottom: none !important; */
}

#selection-composer .v-select--active-menu .v-field.v-field--focused .v-field__outline .v-field__outline__start {
  border-bottom: none !important;
}
#selection-composer .v-select--active-menu .v-field.v-field--focused .v-field__outline .v-field__outline__end {
  border-bottom: none !important;
}
#selection-composer  .v-select--active-menu .v-field.v-field--focused .v-field__outline .v-field__outline__notch::after {
  border-color: transparent !important;
}
</style>
