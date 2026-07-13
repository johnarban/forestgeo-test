<script lang="ts">
/**
 * v-snackbar wrapper component. The message can be passed
 * as a prop or as as the default slot. Props are passed
 * through to v-snackbar.
 * 
 * Example Usage
 * 
 * <SnackbarAlert msg="Hello there" />
 * 
 * <SnackbarAlert msg="Hello there">
 *  <template v-slot:activator="{ onClick, id }">
 *   <v-btn :id="id" @click="onClick" color="primary">
 *    Custom Activator
 *   </v-btn>
 *  </template>
 * </SnackbarAlert>
 * 
 */
import { defineComponent } from 'vue';

export default defineComponent({
  name: "SnackbarAlert",
  
  emits: ['update:modelValue'],

  props: {
    msg: {
      type: String || undefined || null,
      required: false,
      default: undefined,
    },
    hide: {
      type: Boolean,
      required: false,
      default: false
    },
    label: {
      type: String,
      required: false,
      default: "Recent changes"
    },
    modelValue: {
      type: Boolean,
      required: false,
      default: false
    },
    hideButton: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data() {
    return {
      snackbar: false,
    };
  },
  
  methods: {
    openDialog() {
      if (this.snackbar) return;
      
      this.snackbar = true;
      this.$emit('update:modelValue', true);
      this.$nextTick(() => {
        (this.$refs.snackbarMessage as HTMLElement).focus();
      });
    },
    closeDialog() {
      this.snackbar = false;
      this.$emit('update:modelValue', false);
      // make sure the focus goes back to the right place
      this.$nextTick(() => {
        this.$el.querySelector('#snackbar-activator')?.focus();
        this.$el.querySelector('#snackbar-activator-slot')?.focus();
      });
    },
  },
  
  watch: {
    modelValue(val: boolean) {
      if (val) {
        this.openDialog();
      } else {
        this.closeDialog();
      }
    }
  }


});
</script>

<template>
  <div class="cds-snackbar-alert ma-2" v-if="!hide">
    
    <slot v-if="!hideButton" name="activator" :onClick="openDialog" id="snackbar-activator-slot">
      <v-btn @click="openDialog" color="#333" id="snackbar-activator" size="small">
        <template v-slot:prepend>
          <v-icon color="red" icon="mdi-alert-octagram"></v-icon>
        </template>
        {{ label }}
      </v-btn>
    </slot>
    
    <v-snackbar 
      v-model="snackbar" 
      location="top center" 
      v-bind="$attrs"
      close-on-back
      role="alert"
      aria-live="assertive"
      timeout="-1"
      >
      <span ref="snackbarMessage" tabindex="0" @keydown.esc="closeDialog">
      <slot> {{ msg }} </slot>
      </span>


      <template v-slot:actions>
        <v-btn tabindex="0" color="red" variant="text" @click="closeDialog">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
