<template>
  <plotly-graph
    :datasets="rezonedDatasets"
    :colors="colors"
    :show-errors="showErrors"
    :data-options="dataOptions"
    :error-bar-styles="errorBarStyles"
    :names="names"
    :layout-options="mergedLayoutOptions"
    :config-options="configOptions"
    :yaxis-title="yaxisTitle"
    :xaxis-title="xaxisTitle"
    @click="(value) => emit('plot-click', value)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PlotlyGraph, { type PlotlyGraphProps } from './plotly/PlotlyGraph.vue';
import { mergeFoldTypeLayout } from './plotly/plotly_styles';
import type { FoldType } from '../esri/services/aggregation';
import { toZonedTime } from 'date-fns-tz';

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function cloneTimeFromLocalToBrowser(date: Date, timeZone: string): Date {
  // Get the equivalent time in the target timezone
  const zonedDate = toZonedTime(date, timeZone);
  // Create a new date object in the local timezone with the same components
  return new Date(
    zonedDate.getFullYear(),
    zonedDate.getMonth(),
    zonedDate.getDate(),
    zonedDate.getHours(),
    zonedDate.getMinutes(),
    zonedDate.getSeconds(),
    zonedDate.getMilliseconds()
  );
}

export interface FoldedPlotlyGraphProps extends PlotlyGraphProps {
  foldType: FoldType;
  timezones?: string | string[];
}

const props = defineProps<FoldedPlotlyGraphProps>();

const rezonedDatasets = computed(() => {
  // do nothing if the timeseries isn't usind Date object
  if (props.datasets.length === 0 || !(props.datasets[0].x[0] instanceof Date) || !props.timezones) {
    return props.datasets;
  }
  return props.datasets.map((dataset, index) => {
    const timezone = Array.isArray(props.timezones) ? props.timezones[index] : props.timezones;
    const newX = dataset.x.map((x) => {
      if (x instanceof Date) {
        return cloneTimeFromLocalToBrowser(x, timezone ?? browserTimeZone);
      }
      return x;
    });
    return {...dataset, x: newX};
  });
});

const emit = defineEmits<{
  (event: "plot-click", value: {x: number | string | Date | null, y: number, customdata: unknown}): void;
}>();

// Merge the fold-type specific layout with any custom layout options
const mergedLayoutOptions = computed(() => {
  return mergeFoldTypeLayout(props.foldType, props.layoutOptions);
});
</script>
