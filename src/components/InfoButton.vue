<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip :text="tooltipTextValue" :disabled="!showTooltip">
        <template v-slot:activator=" { props} ">
        <slot name="activator" v-bind="{...activatorProps, ...props, show: dialogVisible}">
          <v-icon 
            v-bind="{...activatorProps, ...props}" 
            class="info-button-icon"
            elevation="1"
            @click="dialogVisible = true"
            @keydown="handleKeydown"
          >
            mdi-information-variant-circle-outline
          </v-icon>
        </slot>
        </template>
      </v-tooltip>
    </template>
    <v-card class="gradient-background">
      <div class="info-button-close-icon">
        <v-icon 
          class="info-button-close-icon__icon"
          @click="dialogVisible = false"
          @keydown="handleKeydown"
        >
          mdi-close
        </v-icon>
      </div>
      <div class="v-card-info-text ma-3">
        <slot>{{ helpText }}</slot>
      </div>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InfoButton',
  props: {
    helpText: {
      type: String,
      required: false
    },
    showTooltip: {
      type: Boolean,
      required: false,
      default: true
    },
    tooltipText: {
      type: String,
      required: false,
      default: undefined
    }
  },
  

  
  data() {
    return {
      dialogVisible: false,
      tooltipTextValue: this.tooltipText ?? (this.showTooltip ? 'Learn More' : undefined),
    };
  },

  methods: {
    handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        this.dialogVisible = !this.dialogVisible;
      }
    },
  },
});
</script>

<style scoped>
.v-card-info-text {
  font-size: 1em;
  line-height: 1.5em;
  padding-block: 1em;
  padding-inline: 1.5em;
  
  p {
    margin-block: 0.5em;
  }

}

.v-card-info-text > p {
  margin-bottom: 1em;
}

.info-button-close-icon {
  position: fixed;
  right: 0.5em;
  height: 1em;
}

.info-button-close-icon__icon {
  /* position:absolute !important;
  right:0 !important; */
  float:right;
  right: 1em;
  top: 1em;

  cursor:pointer;
  
  padding:1em !important;
  margin:-1em !important;
}

.info-button-close-icon__icon:hover {
  background-color: #f0f0f0;
  color: black;
  border-radius: 50%;
  padding: 0.5em;
  margin: -0.5em;
  transition: background-color 0.3s;
}

.info-button-icon {
  font-size: 1.3em; 
  color: var(--accent-color);
}

</style>