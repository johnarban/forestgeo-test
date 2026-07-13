<template>
  <v-btn
  @click="onClick"
  @keyup.enter="onClick"
  icon="mdi-camera-outline"
  >
  </v-btn>
</template>

<script setup lang="ts">
import { downloadMap } from '@/utils/canvas_downloader';
import { type Map } from 'maplibre-gl';

interface MaplibreDownloadButtonProps {
  map: Map | null,
  filename: string
}

const props = defineProps<MaplibreDownloadButtonProps>();

const onClick = () => {
  if (!props.map) return;
  downloadMap(props.map as Map, props.filename);
};
</script>
