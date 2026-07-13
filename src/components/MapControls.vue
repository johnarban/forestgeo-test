<template>
  <div class="map-view">
    <h2>Explore Map View</h2>
    <p class="my-2">Select a date and timezone to display</p>
    <div class="map-view-controls">
      <div class="date-view-controls mt-2">
        <div class="d-flex flex-row align-center">
          <v-radio-group v-model="radio">
            <date-picker
              class="cds__date-picker tall"
              ref="calendar"
              :model-value="singleDateSelected"
              @internal-model-change="(value: Date) => {
                if (value != null && value.getTime() != singleDateSelected.getTime()) {
                  radio = null;
                  singleDateSelected = value;
                  calendar?.closeMenu();
                }
              }"
              :allowed-dates="uniqueDays"
              :input-atters="{clearable: false}"
              :time-config="{ enableTimePicker: false }"
              :multi-dates="false"
              :transitions="false"
              :formats="{'input': (date: Date | null) => date?.toDateString(), 'preview': (date: Date | null) => date?.toDateString()}"
              :week-start="0"
              no-today
              dark
              :year-range="[uniqueDays[0]?.getFullYear(), uniqueDays[uniqueDays.length - 1]?.getFullYear()]"
              six-weeks
            >
              <template #action-buttons>
                <button
                  class="dp__action_button dp__action-latest"
                  @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                  @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                  :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                  elevation="0"
                  size="sm"
                >
                  Latest
              </button>
              </template>
              <!-- <template #action-extra="{ selectCurrentDate }">
              
              </template> -->
            </date-picker>
            <!-- time chips to select time specifically for esri times -->
          </v-radio-group>
        </div>        
        <!-- add buttons to increment and decrement the singledateselected -->
        <div class="d-flex flex-row align-center my-2">
          <v-tooltip :disabled="touchscreen" text="Previous Date">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="rounded-icon-wrapper"
                @click="store.moveBackwardOneDay"
                @keyup.enter="store.moveBackwardOneDay"
                :disabled="singleDateSelected === uniqueDays[0]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                <v-icon>mdi-chevron-double-left</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip :disabled="touchscreen" text="Get Data for latest available day">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                style="padding-inline: 4px;"
                @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                Latest Available Data
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip :disabled="touchscreen" text="Next Date">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="rounded-icon-wrapper"
                @click="store.moveForwardOneDay"
                @keyup.enter="store.moveForwardOneDay"
                :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                <v-icon>mdi-chevron-double-right</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
      <div class="map-dropdown-container d-flex flex-row flex-wrap">
        <v-select
          v-model="selectedTimezone"
          class="map-dropdowns timezone-dropdown"
          label="Timezone"
          :items="timezoneOptions"
          item-title="name"
          item-value="tz"
          hide-details
          dense
          variant="outlined"
        ></v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";

import { type MoleculeType } from "@/esri/utils";
import { useTempoStore } from "@/stores/app";
// import { useEsriTimesteps } from "@/composables/useEsriTimesteps";

// import TimeChips from "@/components/TimeChips.vue";

const store = useTempoStore();
const {
  singleDateSelected,
  uniqueDays,
  selectedTimezone,
  timezoneOptions,
} = storeToRefs(store);

const emit = defineEmits<{
  (event: "molecule", molecule: MoleculeType): void;
}>();

const molecule = ref<MoleculeType>('no2');

const radio = ref<number | null>(null);
const touchscreen = supportsTouchscreen();

const calendar = ref<typeof VueDatePicker | null>(null);


watch(molecule, (newMol: MoleculeType) => {
  emit("molecule", newMol);
});
</script>

<style lang="less">

.map-view {
  margin: 1rem;
}

.map-view-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
}

.date-view-controls {
  flex: 0 0 auto; /* Don't shrink, don't grow, auto width */
  min-width: 220px; /* Minimum width before parent wraps */
}

.cds__date-picker .tall {
  height: 58px;
}

.map-dropdown-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1 1 210px; 

  .map-dropdowns {

    font-family: var(--dp-font-family);
    height: 56px !important;

    .v-field--variant-outlined .v-field__outline__start, .v-field--variant-outlined .v-field__outline__end {
      border-color: rgba(255, 255, 255, 0.7);
      opacity: 1;
    }

    .v-field--variant-outlined .v-field__outline__notch {
      border-bottom: solid 1px rgba(255, 255, 255, 0.7);
    }

    .v-field--variant-outlined .v-field__outline__notch::after {
      border-bottom: solid 1px rgba(255, 255, 255, 0.6);
    }

    &.timezone-dropdown {
      width: 220px !important;
      max-width: 220px !important;
    }

    &.molecule-dropdown {
      width: 220px !important;
      max-width: 220px !important;
    }

  }
}

</style>
