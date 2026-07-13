<template>
<div class="dataset-plot-container">
  <h3 class="dataset-plot__title">{{ dataset.name }}</h3>
  <div class="dataset-plot__fold-desc" v-if="datasetIsFolded">
    <ul>
      <li v-if="dataset.folded?.foldingPeriod && dataset.folded.foldingPeriod.toLowerCase()!== 'none'">Stacked by {{ dataset.folded?.foldingPeriod }}</li>
      <li v-if="dataset.folded?.timeBin && dataset.folded?.timeBin.toLowerCase() !== 'none'" >Binned by {{ dataset.folded?.timeBin }}</li>
    </ul>
  </div>
  <div class="dataset-plot">
    <local-scope
      :descriptor="moleculeDescriptor(dataset.molecule)"
    >
      <template #default="{ descriptor }">
        <div v-if="datasetIsFolded" class="dataset-plot__plot dataset-plot-folded">
        <FoldedPlotlyGraph
          :datasets="[dataset.plotlyDatasets![1]]"
          :show-errors="props.showErrors"
          :colors="[(dataset.customColor ?? dataset.region.color)]"
          :data-options="ddataOptions"
          :names="[dataset.name ?? dataset.id]"
          :layout-options="dlayoutOptions"
          :fold-type="dataset.folded?.foldType"
          :timezones="[dataset.folded.timezone ?? 'UTC']"
          :config-options="dconfigOptions"
          :xaxis-title="`Time: ${dataset.folded.foldType}`"
          :yaxis-title="moleculeYAxisTitle(descriptor)"
          @plot-click="(value) => emit('plot-click', value)"
        />
        </div>
        <div v-else class="dataset-plot__plot dataset-plot-normal">
        <PlotlyGraph
          :datasets="[userDatasetToPlotly(dataset, true)]"
          :colors="[dataset.customColor || dataset.region.color]"
          :show-errors="showErrors"
          :data-options="ddataOptions"
          :names="[dataset.name ?? dataset.id]"
          :layout-options="{
            ...dlayoutOptions,
            xaxis: {...(dlayoutOptions?.xaxis ?? {}), title: {text: 'Local Time for Region'}},
          }"
          :config-options="dconfigOptions"
          xaxis-title="Time"
          :yaxis-title="moleculeYAxisTitle(descriptor)"
          @click="(value) => emit('plot-click', value)"
        />
        </div>
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
import { DEFAULT_PLOT_CONFIG , DEFAULT_PLOT_LAYOUT } from "@/components/plotly/defaults";


interface UserDatasetPlotProps extends Omit<FoldedPlotlyGraphProps, 'datasets'| 'foldType' | 'timezones'> {
  dataset: UserDataset;
}
const props = withDefaults(defineProps<UserDatasetPlotProps>(), {
  showErrors: false,
});

const emit = defineEmits<{
  (event: "plot-click", value: {x: number | string | Date | null, y: number, customdata: unknown}): void;
}>();


// Common layout options for all plots
const dlayoutOptions: Partial<Layout> = deepMerge(
  DEFAULT_PLOT_LAYOUT,
  {
    margin: { t: 20, r: 30, b: 60, l: 80 },
    autosize: false,
    ...(props.layoutOptions ?? {}),
  });

// Common config options for all plots
const dconfigOptions: Partial<Config> = deepMerge(DEFAULT_PLOT_CONFIG, 
  {
    responsive: true,
    ...(props.configOptions ?? {}),
  });

const ddataOptions = computed(() => {
  const defaultOpt = {showlegend: false};
  if (props.dataOptions && props.dataOptions.length > 0) {
    return props.dataOptions.map((opt) => ({...opt, ...defaultOpt}));
  } else {
    return [{...defaultOpt}];
  }
});

const isFolded = (d: UserDataset) => d.folded && d.plotlyDatasets;
const datasetIsFolded = computed(() => isFolded(props.dataset));

</script>

<style scoped>
div.dataset-plot-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

div.dataset-plot {
  width: 100%;
}

h3.dataset-plot__title {
  font-weight: normal;
  margin-bottom: 5px;
}

div.dataset-plot__plot {
  width: 100%;
  height: 100%;
  margin-block: 4px;
  padding-inline: 5px;
  border-radius: 6px;
  background-color: rgba(0 0 0 / .25);
  font-size: 0.8em;
}

.dataset-plot__fold-desc ul {
  list-style-position: inside;
  padding-left: 5px;
}
</style>
