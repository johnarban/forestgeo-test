<style>
.cds-marquee-alert
{
  position: sticky;
  top: 0;
  left: 0;
  /* width: 100vw; */
  padding-inline: 1rem;
  padding-block: 5px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background-color: rgb(var(--v-theme-success));
  color: white;
  z-index: 9999;
}

.cds-marquee-alert__content
{
  line-height: 1.5;
  flex-grow: 1;
}

.cds-marquee-alert__close-button
{
  padding: 5px;
}
</style>

<template>
  <div v-if="isVisible" class="cds-marquee-alert elevation-3 sucess">
    <v-avatar variant="flat" color="info" icon="mdi-exclamation-thick" />
    <div class="cds-marquee-alert__content">
      <slot>
        <span>{{ message }}</span>
      </slot>
    </div>
    <v-btn @click="close" class="cds-marquee-alert__close-button" aria-label="Close alert" variant="tonal">
      Close
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'MarqueeAlert',

  props: {
    message: {
      type: String,
      default: 'hello'
    },
    modelValue: {
      type: Boolean,
      required: false,
      default: true
    },
    timeout: {
      type: Number,
      default: 5000
    }
  },
  
  mounted() {
    setTimeout(() => {
      this.isVisible = false;
    }, this.timeout);
  },

  data() {
    return {
      isVisible: true,
    };
  },

  methods: {
    close() {
      this.isVisible = false;
    }
  },

  watch: {
    isVisible(value) {
      this.$emit('update:modelValue', value);
    },

    modelValue(value) {
      this.isVisible = value;
    }
  }


});
</script>
