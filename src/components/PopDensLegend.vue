<script setup lang="ts">
import LegendBase from "@/components/LegendBase.vue";
import MiniLegend from "./MiniLegend.vue";
const { mini } = defineProps<{ mini?: boolean }>();
const colors = [
  "rgb(253,239,154)",
  "rgb(169,216,92)",
  "rgb(90,185,120)",
  "rgb(60,147,135)",
  "rgb(32,110,139)",
  "rgb(19,67,155)",
  "rgb(42,24,108)"
];
const data = [
  { name: "1",
    label: "<1",
    color: colors[0],
    text: "Less than 1 person per square kilometer."
  },
  
  { name: "5",
    label: "1 - 5",
    color: colors[1],
    text: "1 to 5 people per square kilometer.",
  },
  
  { name: "25",
    label: "5 - 25",
    color: colors[2],
    text: "5 to 25 people per square kilometer.",
  },
  
  { name: "250",
    label: "25 - 250",
    color: colors[3],
    text: "25 to 250 people per square kilometer.",
  },
  
  { name: "1000",
    label: "1k - 5k",
    color: colors[4],
    text: "250 to 1,000 people per square kilometer.",
  },
  
  { name: "5k - 50k",
    label: "5k - 50k",
    color: colors[5],
    text: "5,000 to 50,000 people per square kilometer.",
  },

  { name: "50000",
    label: ">50k",
    color: colors[6],
    text: "More than 50,000 people per square kilometer.",
  },
];

</script>

<template>
  <div class="pop-dens-legend-container">
    <div v-if="mini" class="pop-dens-mini">
      <MiniLegend
        :data="data"
        :miniOptions="{ colorIndices: [0, 1, 2, 3, 4, 5, 6], labelIndices: [0, 1, 2, 3, 4, 5, 6] }"
      />
      <div class="subtitle">Population Density (people/km²)</div>
      
    </div>
  
  <LegendBase
    v-else
    class="pop-dens-legend"
    :data="data"
    info-text="Learn more about Population density colors."
    citation="Source: NASA SEDAC: Gridded Population of the World, Version 4 (GPWv4): Population Density"
  />
  </div>

</template>

<style scoped>


.long-legend > .legend-label {
  grid-template-columns: minmax(auto, 100px) 1fr;
}

.subtitle {
  text-align: center;
  font-weight: normal;
  font-size: 0.8em;
  margin-top: 0.25em;
}

</style>