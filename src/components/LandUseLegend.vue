<script setup lang="ts">
import LegendBase from "@/components/LegendBase.vue";
const data = [
  { name: "built",
    label: "Built Area",
    color: "#ed242b",
    text: "Human made structures; major road and rail networks; large homogenous impervious surfaces including parking structures, office buildings and residential housing; examples: houses, dense villages / towns / cities, paved roads, asphalt."
  },
  
  { name: "water",
    label: "Water",
    color: "#1b5bab",
    text: "Areas where water was predominantly present throughout the year; may not cover areas with sporadic or ephemeral water; contains little to no sparse vegetation, no rock outcrop nor built up features like docks; examples: rivers, ponds, lakes, oceans, flooded salt plains.",
  },
  
  { name: "trees",
    label: "Trees",
    color: "#358221",
    text: "Any significant clustering of tall (~15 feet or higher) dense vegetation, typically with a closed or dense canopy; examples: wooded vegetation, clusters of dense tall vegetation within savannas, plantations, swamp or mangroves (dense/tall vegetation with ephemeral water or canopy too thick to detect water underneath).",
  },
  
  { name: "crops",
    label: "Crops",
    color: "#fcdb5c",
    text: "Human planted/plotted cereals, grasses, and crops not at tree height; examples: corn, wheat, soy, fallow plots of structured land.",
  },
  
  { name: "rangeland",
    label: "Rangeland",
    color: "#efcfa8",
    text: "Open areas covered in homogenous grasses with little to no taller vegetation; wild cereals and grasses with no obvious human plotting (i.e., not a plotted field); examples: natural meadows and fields with sparse to no tree cover, open savanna with few to no trees, parks/golf courses/lawns, pastures. Mix of small clusters of plants or single plants dispersed on a landscape that shows exposed soil or rock; scrub-filled clearings within dense forests that are clearly not taller than trees; examples: moderate to sparse cover of bushes, shrubs and tufts of grass, savannas with very sparse grasses, trees or other plants.",
  },
  
  { name: "flooded",
    label: "Flooded Vegetation",
    color: "#87d19e",
    text: "Areas of any type of vegetation with obvious intermixing of water throughout a majority of the year; seasonally flooded area that is a mix of grass/shrub/trees/bare ground; examples: flooded mangroves, emergent vegetation, rice paddies and other heavily irrigated and inundated agriculture.",
  },

  { name: "bare",
    label: "Bare Ground",
    color: "#ede9e4",
    text: "Areas of rock or soil with very sparse to no vegetation for the entire year; large areas of sand and deserts with no to little vegetation; examples: exposed rock or soil, desert and sand dunes, dry salt flats/pans, dried lake beds, mines.",
  },
  
  { name: "snow",
    label: "Snow/Ice",
    color: "#f2faff",
    text: "Large homogenous areas of permanent snow or ice, typically only in mountain areas or highest latitudes; examples: glaciers, permanent snowpack, snow fields.",
  },
  
  { name: "clouds",
    label: "No Data",
    color: "#c8c8c8",
    text: "No land cover information due to persistent cloud cover.",
  }
];

</script>

<template>
  <LegendBase
    class="land-use-legend"
    :data="data"
    info-text="Learn more about Land Use colors."
    citation="Source: ESRI Living Atlas: Sentinel-2 10m Land Use/Land Cover Time Series by Impact Observatory"
  />

</template>

<style scoped>


.long-legend > .legend-label {
  grid-template-columns: minmax(auto, 100px) 1fr;
}

</style>