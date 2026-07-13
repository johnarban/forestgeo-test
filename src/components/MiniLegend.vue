<script setup lang="ts">

interface Entry {
  name: string;
  label: string;
  color: string;
  text: string;
}

interface MiniOptions {
  colorIndices: number[];
  labelIndices: number[];
}

interface Props {
  data: Entry[];
  subtitle?: string;
  miniOptions?: MiniOptions;
}

const { data, miniOptions } = defineProps<Props>();

const labelIndices = miniOptions ? miniOptions.labelIndices : [0, data.length - 1];
const colorIndices = miniOptions ? miniOptions.colorIndices : labelIndices;

</script>

<template>
  <div class="mini-legend">
    <div 
      :class="`legend-label ll-${data[value].name}`" 
      v-for="(value) of colorIndices" 
      :style="{'--label-color': data[value].color}" 
      :key="data[value].name"
    >
      <dt v-if="labelIndices.includes(value)" class="legend-text">
        {{data[value].label}}
      </dt>
    </div>
    <div style="flex-grow: 50;"></div>
  </div>
</template>

<style scoped>
  .legend-label {
    position: relative;
    margin: 0.25em;
    --space: 5px;
    padding: var(--space);
    padding-left: calc(1.5em + var(--space));
  } 

  .legend-label::before {
    content: '';
    display: inline;
    width: 1em;
    height: 1em;
    position: absolute;
    left: var(--space);
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0px 0px 0px 1px white, 0px 0px 0px 3px black;
    color: var(--label-color);
    background-color: currentColor;
  }
  
  .legend-text {
    font-weight: normal;
  }
  
  /* mini-legend */
  .mini-legend {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    gap: 1em;
    justify-content: space-around;
    flex-wrap: wrap;
  }
  
  .mini-legend .legend-label {
    margin: 0;
    height: 3em;
  }
  
  .mini-legend .legend-label::before {
    display: block;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0px 0px 0px 1px white, 0px 0px 0px 3px black;
  }
  
  .mini-legend .legend-label .legend-text {
    font-size: 0.8em;
    position: absolute;
    top: 1.5em;
    left: 50%;
    transform: translateX(-50%);
    /* width: 100%; */
    width: max-content;
    text-align: center;
  }
</style>
