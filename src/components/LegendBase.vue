<script setup lang="ts">

interface Entry {
  name: string;
  label: string;
  color: string;
  text: string;
}
interface Props {
  data: Entry[];
  infoText: string;
  citation: string;
}
const { data, infoText, citation } = defineProps<Props>();

</script>

<template>
<div class="tempods-legend-container">
  
  <!-- Basic Legend -->
  <div class="short-legend">
    <div 
      v-for="item of data" 
      :class="`legend-label ll-${item.name}`" 
      :style="{'--label-color': item.color}" 
      :key="item.name"
      >
      <dt class="legend-text">{{item.label}}</dt>
    </div>
  </div>

  <!-- More Info -- full Legend w/ explanations -->
  <info-button max-width="80%" max-height="400px">
    <template #activator="props">
      <slot name="infoButton" :props="props">
      <a
        class="legend-more-details"
        href="#"
        role="button"
        v-bind="props"
      >
        {{ infoText }}
      </a>
    </slot>
    </template>
    <!-- add this class so that we can still use nesting :) -->

      <div class="long-legend">
        <div v-for="item of data" :class="`legend-label ll-${item.name}`" :style="{'--label-color': item.color}" :key="item.name">
          <dt class="legend-text">{{item.label}}</dt>
          <dd class="legend-text-detail"> {{ item.text }} </dd>
        </div>
      </div>

    <slot name="citation">
      <cite> {{ citation }} </cite>
    </slot>
  </info-button>
  
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
  .legend-text-detail {
    display: block;
    padding: 0;
    margin: 0;
  }
  
  /* short legend */
  .short-legend {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  /* long legend */
  .long-legend {
    display: block;
    padding-left: 0.5em;
    margin: 1em;
  }

  .long-legend > .legend-label {
    border-bottom: 1px solid white;
    display: grid;
    grid-template-columns: minmax(auto, 100px) 1fr;
    column-gap: 1em;
    align-items: center;
    margin-bottom: 1.5em;
  }

  
  cite {
    font-size: 0.7em;
    color: gray;
  }
  a.legend-more-details {
    font-size: 0.8em;
    cursor: pointer;
    text-decoration: underline;
    color:rgb(175, 175, 175);
  }

</style>