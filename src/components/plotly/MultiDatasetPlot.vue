<template>
  <div class="dataset-plot-container">
    <div class="dataset-plot" v-if="foldedDatasets.size > 0">
      <local-scope
        :descriptor="moleculeDescriptor(datasets[0].molecule)"
      >
        <template #default="{ descriptor }">
          <details :open="open || (firstOpen && normalDatasets.length === 0 && index===0)" :class="['dataset-plot__plot', 'dataset-plot-details', 'folded-data-details']" v-for="([foldType, datasets], index) in foldedDatasets" :key="foldType">
            <summary>
              <!-- {molecule} folded timeseries -->
              <div>
                {{ descriptor.fullName.text }} Timeseries - {{ foldTypeToHumanReadable(foldType as FoldType) }}
              </div>
            </summary>
            <folded-plotly-graph
              :datasets="datasets.map(d => d.plotlyDatasets![1])"
              :show-errors="props.showErrors"
              :colors="datasets.map(d => (d.customColor ?? d.region.color))"
              :data-options="ddataOptions"
              :names="datasets.map(d => d.name ?? d.id)"
              :layout-options="dlayoutOptions"
              :fold-type="datasets[0].folded?.foldType"
              :timezones="datasets.map(d => d.folded.timezone ?? 'UTC')"
              :config-options="dconfigOptions"
              :yaxis-title="moleculeYAxisTitle(descriptor)"
              @plot-click="(value) => emit('plot-click', value)"
            />
          </details>
        </template>
      </local-scope>
    </div>
    <div class="dataset-plot" v-if="normalDatasets.length > 0">
      <local-scope
        :descriptor="moleculeDescriptor(normalDatasets[0].molecule)"
      >
        <template #default="{ descriptor }">
          <details :open="open || firstOpen" :class="['dataset-plot__plot', 'dataset-plot-details', 'normal-data-details']" >
            <summary>
              <!-- {molecule} timeseries -->
              <div>
                {{ descriptor.fullName.text }} Timeseries
              </div>
            </summary>
            <plotly-graph
              :datasets="normalDatasets.map(d => userDatasetToPlotly(d, true))"
              :colors="normalDatasets.map(d => (d.customColor || d.region.color))"
              :show-errors="showErrors"
              :data-options="ddataOptions"
              :names="normalDatasets.map(d => d.name ?? d.id)"
              :layout-options="{
                ...dlayoutOptions,
                xaxis: {...(dlayoutOptions?.xaxis ?? {}), title: {text: 'Local Time for Region'}},
              }"
              :config-options="dconfigOptions"
              :yaxis-title="moleculeYAxisTitle(descriptor)"
              @click="(value) => emit('plot-click', value)"
            />
          </details>
        </template>
      </local-scope>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FoldedPlotlyGraph from '../FoldedPlotlyGraph.vue';
import type {FoldedPlotlyGraphProps} from '../FoldedPlotlyGraph.vue';
import PlotlyGraph from './PlotlyGraph.vue';
import { userDatasetToPlotly } from '@/utils/data_converters';
import type { UserDataset } from '@/types';
import type { Config, Layout } from 'plotly.js-dist-min';
import { moleculeDescriptor, moleculeYAxisTitle } from '@/esri/utils';
import { deepMerge } from './plotly_styles';
import { DEFAULT_PLOT_LAYOUT, DEFAULT_PLOT_CONFIG } from "@/components/plotly/defaults";
import type { FoldType } from '@/esri/services/aggregation';
import { camelToSnake } from '@/utils/text';

function foldTypeToHumanReadable(ft: FoldType): string {
  switch (ft) {

  case 'hourOfDay':
    return 'Stacked by day, binned by hour';
  case 'noneOfDay':
    return 'Stacked by day';
    
  case 'hourOfWeek':
    return 'Stacked by week, binned by hour';
  case 'dayOfWeek':
    return 'Stacked by week, binned by day';
  case 'noneOfWeek':
    return 'Stacked by week';

  case 'hourOfMonth':
    return 'Stacked by month, binned by hour';
  case 'dayOfMonth':
    return 'Stacked by month, binned by day';
  case 'weekOfMonth':
    return 'Stacked by month, binned by week';
  case 'noneOfMonth':
    return 'Stacked by month';

  case 'hourOfYear':
    return 'Stacked by year, binned by hour';
  case 'dayOfYear':
    return 'Stacked by year, binned by day';
  case 'weekOfYear':
    return 'Stacked by year, binned by week';
  case 'monthOfYear':
    return 'Stacked by year, binned by month';
  case 'noneOfYear':
    return 'Stacked by year';

  case 'hourOfNone':
    return 'Hourly average';
  case 'dayOfNone':
    return 'Daily average';
  case 'weekOfNone':
    return 'Weekly average';
  case 'monthOfNone':
    return 'Monthly average';

  default:
    return camelToSnake(ft);
  }
}


interface DatasetPlotProps extends Omit<FoldedPlotlyGraphProps, 'datasets'| 'foldType' | 'timezones'> {
  datasets: UserDataset[];
  open: boolean;
  firstOpen: boolean;
}
const props = withDefaults(defineProps<DatasetPlotProps>(), {open: false, firstOpen: false});
const emit = defineEmits<{
  (event: "plot-click", value: {x: number | string | Date | null, y: number, customdata: unknown}): void;
}>();



// Common layout options for all plots
const dlayoutOptions: Partial<Layout> = deepMerge(
  DEFAULT_PLOT_LAYOUT,
  {
    margin: { t: 20, r: 30, b: 60, l: 80 },
    autosize: true,
    ...(props.layoutOptions ?? {}),
  });

// Common config options for all plots
const dconfigOptions: Partial<Config> = deepMerge(
  DEFAULT_PLOT_CONFIG,
  {
    responsive: true,
    ...(props.configOptions ?? {}),
  });

const ddataOptions = computed(() => {
  const defaultOpt = {showlegend: true};
  if (props.dataOptions && props.dataOptions.length > 0) {
    return props.dataOptions.map((opt) => ({...opt, ...defaultOpt}));
  } else {
    return [{...defaultOpt}];
  }
});

const foldedDatasets = computed(() => {
  const byGroup: Map<string, UserDataset[]> = new Map();
  props.datasets
    .forEach(d => {
      if (d.folded && d.plotlyDatasets) {
        const ft = d.folded.foldType;
        if (byGroup.has(ft)) {
          byGroup.get(ft)!.push(d);
        } else {
          byGroup.set(ft, [d]);
        }
      }
    });

  
  return byGroup;
});

const normalDatasets = computed(() => {
  return props.datasets.filter(d => !d.folded);
});


</script>

<style scoped>
div.dataset-plot-container {
  display: flex;
  flex-direction: column-reverse;
  gap: 5px;
}

div.dataset-plot {
  display: flex;
  flex-direction: column;
}


details.dataset-plot__plot {
  border-radius: 6px;
  background-color: rgba(0 0 0 / .25);
  font-size: 0.8em;
}

details.dataset-plot-details:hover {
  outline: 1px solid #888;
}
details.dataset-plot-details.single-plot:hover {
  outline: none;
}

details.dataset-plot-details > summary {
  display: block;
}
details.dataset-plot-details.single-plot > summary {
  display: none;
}
details.dataset-plot-details > summary > div {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 3em;
}

/* https://stackoverflow.com/a/66487919/11594175 */
details.dataset-plot-details > summary::marker,
details.dataset-plot-details > summary::-webkit-details-marker {
  display: none;
  content: "";
}

details.dataset-plot-details > summary:before {
  content: "►";
  display: inline-block;
  margin-right: 6px;
  transition: transform 50ms 0s ease-in-out;
  /*
  transition-property: transform;
  transition-duration: 50ms;
  transition-delay: 0s;
  transition-timing-function: ease-in-out;
  */
}
details[open].dataset-plot-details > summary:before {
  content: "►";
  transform: rotate(90deg);
}
</style>
