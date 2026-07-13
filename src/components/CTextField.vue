<template>
  <v-card 
    class="mx-auto px-3 py-2 popup-card--outline" 
    :min-width="minWidth" 
    :width="width"
    >
    <slot name="title">
      <v-card-title>
        {{ title }}
      </v-card-title>
    </slot>
    <v-text-field
      class="mb-2 px-2"
      v-bind="$attrs"
      v-model="local"
      :label="label"
      hide-details
      autofocus
      @keyup.enter="onConfirm"
    />
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="emit('cancel')">Cancel</v-btn>
      <v-btn
        :color="buttonColor"
        variant="flat"
        :disabled="!local.trim()"
        @click="onConfirm"
      >{{ confirmText }}</v-btn>
    </v-card-actions>
    
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
defineOptions({ inheritAttrs: false });


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<{
  title?: string;
  label?: string;
  buttonColor?: string;
  confirmText?: string;
  minWidth?: string | number;
  width?: string | number;
}>(), {
  confirmText: 'Done',
  minWidth: 300,
  width: '50%',
});

// const modelValue = defineModel('modelValue', { type: String, required: true });

const emit = defineEmits<{
  (e:'update:modelValue', v:string): void;
  (e:'confirm', v:string): void;
  (e:'cancel'): void;
}>();

const local = ref('');
// watch(modelValue, v => { 
//   if (v !== local.value) {
//     local.value = v; 
//   }
// });

// don't update the model value
// watch(local, v => emit('update:modelValue', v));

function onConfirm() {
  if (!local.value.trim()) return;
  emit('confirm', local.value.trim());
}
</script>