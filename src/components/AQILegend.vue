<script setup lang="ts">
import LegendBase from "@/components/LegendBase.vue";

const data = [
  {
    name: "good",
    label: "Good (0–50)",
    color: "#00e400",
    text: "Air quality is satisfactory, and air pollution poses little or no risk.",
  },
  {
    name: "moderate",
    label: "Moderate (51–100)",
    color: "#ffff00",
    text: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
  },
  {
    name: "usg",
    label: "Unhealthy for Sensitive Groups (101–150)",
    color: "#ff7e00",
    text: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  },
  {
    name: "unhealthy",
    label: "Unhealthy (151–200)",
    color: "#ff0000",
    text: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
  },
  {
    name: "very-unhealthy",
    label: "Very Unhealthy (201–300)",
    color: "#8f3f97",
    text: "Health alert: The risk of health effects is increased for everyone.",
  },
  {
    name: "hazardous",
    label: "Hazardous (301+)",
    color: "#7e0023",
    text: "Health warning of emergency conditions: everyone is more likely to be affected.",
  },
];
</script>

<template>
  <LegendBase
    class="aqi-legend"
    :data="data"
    info-text="Learn more about Air Quality colors."
    citation="Source: U.S. EPA - AirNow"
  />
</template>

<style>


.long-legend > .legend-label {
  grid-template-columns: minmax(auto, 200px) 1fr;
}

</style>
