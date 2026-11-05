<template>
  <draggable
    v-if="mapRef"
    v-model="displayOrder"
    handle=".drag-handle"
    class="layer-order"
    :item-key="(item: string) => item"
  >
    <template #item="{ element }">
      <div class="layer-order-row">
        <div class="drag-handle">
          <v-icon size="x-small">mdi-menu</v-icon>
        </div>
        <layer-control-item
          :map="mapRef"
          :layer-id="element"
          :display-name="layerNames[element] ?? element"
          :synced-items="connections[element] ?? []"
        >
          <template #extras="{ visible }">
            <narrow-expansion-panel
              v-if="panels[element]"
              v-show="visible"
              :item="element"
              :label="panels[element].label ?? 'Options'"
              :is-open="false"
            >
              <component :is="panels[element].component" v-bind="panels[element].props ?? {}" />
            </narrow-expansion-panel>
          </template>
        </layer-control-item>
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue";
import draggable from "vuedraggable";
import M from "maplibre-gl";

import { useMaplibreLayerOrderControl } from "@/composables/useMaplibreLayerOrderControl";
import LayerControlItem from "./MaplibreLayerControlItem.vue";
import NarrowExpansionPanel from "./NarrowExpansionPanel.vue";
import type { LayerPanel } from "@/types";

// Drag-to-reorder list of map layers, each with a visibility checkbox and an
// opacity slider. `order` is bottom to top; the list shows it top to bottom.

interface Props {
  mapRef: M.Map | null;
  order: string[];
  layerNames?: Record<string, string>;
  // layers that move, show/hide and fade together with a listed layer
  connections?: Record<string, string[]>;
  // extra controls (e.g. filters) shown in a collapsible block under a layer
  panels?: Record<string, LayerPanel>;
}

const props = withDefaults(defineProps<Props>(), {
  layerNames: () => ({}),
  connections: () => ({}),
  panels: () => ({}),
});
const mapRef = toRef(() => props.mapRef);

const ordering = useMaplibreLayerOrderControl(
  mapRef,
  props.order,
  false,
  Object.entries(props.connections),
);

const displayOrder = computed({
  get(): string[] {
    return ordering.currentOrder.value.slice().reverse();
  },
  set(value: string[]) {
    ordering.controller?.setManagedOrder(value.slice().reverse());
  },
});
</script>

<style scoped lang="less">
.drag-handle {
  font-size: 20pt;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: grab;
  }
}

.layer-order {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer-order-row {
  background: #404040;
  border: 1px solid white;
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.mlc-layer-item {
  border-left: 1px solid white;
  padding: 2px;
}
</style>
