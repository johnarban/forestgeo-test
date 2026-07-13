
<template>
  <use-clipboard v-slot="{ copy }" :source="source">
    <v-snackbar 
      v-if="tooltipDisabled || alert"
      class="share-button-snackbar"   
      timeout="3500" 
      location="top" 
      activator="#share-button"
      text="Share link copied to clipboard. Paste to share this view!"
      color="success"
      variant="flat"
      min-height="0px"
      min-width="0px"
      transition="slide-y-transition"
      close-on-content-click
      >
    </v-snackbar>
    <v-tooltip :disabled="tooltipDisabled" text="Share selected view">
      <template v-slot:activator="{ props }">
        <v-btn
          id="share-button"
          aria-label="Get link to share selected view"
          class="share-button"
          icon
          @click="() => {
            copy(source);
            $emit('share');
          }
          "
          @keyup.enter="() => {
            copy(source);
            $emit('share');
          }"
          v-bind="props"
          :color="buttonColor"
          :elevation="elevation"
          :size="size"
          :rounded="rounded"
        > 
          <v-icon :color="iconColor">mdi-share-variant</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </use-clipboard>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    source: {
      type: String,
      required: true,
    },
    buttonColor: {
      type: String,
      default: "#ffffff66",
    },
    iconColor: {
      type: String,
      default: "#333",
    },
    elevation: {
      type: [String, Number],
      default: "0",
    },
    size: {
      type: String,
      default: "small",
    },
    rounded: {
      type: [String, Number],
      default: "1",
    },
    tooltipDisabled: {
      type: Boolean,
      default: false,
    },
    alert: {
      type: Boolean,
      default: false,
    },
    
  },
  
  data() {
    return {
      snackbar: false,
    };
  },

  emits: ["share"],
});
</script>

<style>
.share-button {
  z-index: 1000;
  padding-inline: 5px;
  border-radius: 8px !important;
  border: thin solid var(--accent-color-2) !important;
}

.share-button-snackbar .v-snackbar__wrapper > .v-snackbar__content {
  padding: 0.75em 1em;
}

</style>
