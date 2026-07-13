<template>
  <div class="forward-geocoding-container" :style="cssStyles">
    <v-combobox
      v-show="searchOpen"
      :class="['forward-geocoding-input', locationJustUpdated ? 'geocode-success' : '', small ? 'forward-geocoding-input-small' : '']"
      v-model="searchText"
      :items="searchResults ? searchResults.features : []"
      :item-title="textForMapboxFeature"
      :bg-color="bgColor"
      label="Enter city or zip"
      :density="small ? 'compact' : 'default'"
      hide-details
      solo
      :color="accentColor"
      @input="() => {}"
      @update:model-value="setLocationFromSearchFeature"
      @keydown.enter="performForwardGeocodingSearch"
      @keydown.esc="searchResults = null"
      :error-messages="searchErrorMessage"
      @click:append="focusCombobox"
      @update:focused="onFocusChange($event)"
      ref="searchInput"
      :menu="menuOpen"
      @update:menu="menuOpen = $event"
    >
    <template v-slot:append>
      <font-awesome-icon
        class="geocoding-search-icon"
        icon="magnifying-glass"
        :size="searchOpen ? 'xl' : buttonSize"
        color="gray"
        @click="toggleSearch"
      ></font-awesome-icon>

      <slot name="append-icon" class="geocode-icon"></slot>

      <font-awesome-icon
        class="geocoding-close-icon"
        v-show="searchOpen && !stayOpen"
        icon="circle-xmark"
        :size="searchOpen ? 'xl' : '1x'"
        color="gray"
        @click="closeSearch"
      ></font-awesome-icon>
    </template>
  </v-combobox>
  <font-awesome-icon
      v-show="!searchOpen && !stayOpen"
      class="geocoding-search-icon"
      icon="magnifying-glass"
      :size="searchOpen ? 'xl' : buttonSize"
      color="gray"
      @click.prevent="toggleSearch"
    ></font-awesome-icon>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { MapBoxFeatureCollection, MapBoxFeature, textForMapboxFeature } from "@/mapbox";

type SearchProvider = (searchText: string) => Promise<MapBoxFeatureCollection | null>;

export default defineComponent({
  name: 'LocationSearch',

  emits: ['update:modelValue', 'set-location', 'error', 'geolocate'],

  props: {
    searchProvider: {
      type: Function as PropType<SearchProvider>,
      default: () => {}
    },
    modelValue: {
      type: Boolean,
      default: true,
      required: false,
    },
    stayOpen: {
      type: Boolean,
      default: false,
    },
    accentColor: {
      type: String,
      default: 'white',
    },
    small: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'dark',
    },
    buttonSize: {
      type: String,
      default: '1x',
    },
    
    bgColor: {
      type: String,
      default: 'white',
    },
    
    persistSelected: {
      type: Boolean,
      default: false,
    },
  },
  
  data() {
    return {
      searchOpen: this.modelValue || this.stayOpen,
      searchText: null as string | null,
      searchResults: null as MapBoxFeatureCollection | null,
      searchErrorMessage: null as string | null,
      locationJustUpdated: false,
      locationUpdatedText: 'Location updated',
      comboFocused: false,
      menuOpen: false,
    };
  },

  computed: {
    cssStyles() {
      return {
        '--accent-color': this.accentColor,
        '--bg-color': this.bgColor,
        '--fg-container-padding': this.searchOpen ? (this.small ? '0px 5px 0px 0px' : '5px 10px 12px 10px') : '0px',
        '--border-radius': this.searchOpen ? '7px' : '20px',
      };
    },
  },
  
  
  

  
  methods: {
    performForwardGeocodingSearch() {
      console.log('performForwardGeocodingSearch', this.searchText);
      if (this.searchText === null || this.searchText.length < 3) {
        return;
      }
      this.searchProvider(this.searchText).then((info) => {
        if (info !== null && info.features?.length === 1) {
          this.setLocationFromSearchFeature(info.features[0]);
        } else if (info !== null && info.features?.length == 0) {
          this.searchErrorMessage = "No matching places were found";
          console.log('No matching places were found');
          this.$emit('error', this.searchErrorMessage);
        } else {
          this.searchResults = info;
        }
      });
    },
    
    textForMapboxFeature(feature: MapBoxFeature) {
      if (typeof feature === 'string') {
        return;
      }
      return textForMapboxFeature(feature);
    },
    
    
    onFocusChange(focused: boolean) {
      this.comboFocused = focused;
      // if (!focused && this.searchResults === null) {
      //   this.searchText = null;
      // }
    },
    
    blurCombobox() {
      const input = this.$refs.searchInput as HTMLInputElement;
      input.blur();
    },
    
    focusCombobox() {
      const input = this.$refs.searchInput as HTMLInputElement;
      input.focus();
    },
    
    setLocationFromSearchFeature(feature: MapBoxFeature | string) {
      // if it's a string do nothing
      if (typeof feature === 'string') {
        return;
      }
      console.log('setting location');
      if (feature === null) { return; }
      const name = this.textForMapboxFeature(feature);
      if (name !== undefined) {
        this.locationUpdatedText = name;
      } else {
        this.locationUpdatedText = feature.place_name.split(',').slice(0, 2).join(', ');
      }
      
      // blur (defocus) the v-combobox
      this.blurCombobox();
      this.timedJustUpdatedLocation();
      this.clearSearchData();
      this.$emit('set-location', [feature, this.locationUpdatedText]);
    },

    toggleSearch() {
      console.log('toggleSearch', this.searchOpen, this.searchText);
      if (this.searchOpen) {
        this.performForwardGeocodingSearch();
        // this.$nextTick(() => this.focusCombobox());
        this.menuOpen = true;
        this.focusCombobox();
      } else {
        this.searchOpen = true;
      }
    },

    closeSearch() {
      this.searchOpen = false;
      this.clearSearchData();
    },

    clearSearchData() {
      this.searchResults = null;
      this.searchText = null;
      this.searchErrorMessage = null;
    },
    
    timedJustUpdatedLocation() {
      this.locationJustUpdated = true;
      setTimeout(() => {
        this.locationJustUpdated = this.persistSelected;
      }, 5000);
    },
  },
  
  watch: {
    
    modelValue(value: boolean) {
      this.searchOpen = value;
    },
    
    searchOpen(value: boolean) {
      this.$emit('update:modelValue', value);
    },
    
    searchText(text: string | null) {
      if (this.searchErrorMessage) {
        this.searchErrorMessage = null;
      }
      if (!text || text.length === 0) {
        this.searchResults = null;
      }
    },
  }
  
});

</script>


<style lang="less">

// https://vue-loader.vuejs.org/guide/scoped-css.html#deep-selectors
.forward-geocoding-container {
  --border-radius: 20px;
  position: relative;
  color: var(--accent-color);
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: var(--border-radius);
  margin-left: 0.25rem;
  margin-bottom: 0.25rem;
  padding: var(--fg-container-padding);
  backdrop-filter: blur(2px);

  .v-field {
    background-color: transparent !important;
  }

  // there are two separate labels, we want the 2nd one to be large. the first is the small floating label
  .v-field > .v-field__field > .v-label.v-field-label:nth-child(2) {
    font-size: 1.2rem;
  }

  // .v-input--horizontal .v-input__append {
  //   margin-inline-start: 0;
  // }
  
  .v-text-field {
    min-width: 150px;
  }
  
  .v-field--variant-filled.v-field--has-background .v-field__overlay {
    border-top-right-radius: 0px;
}

  .forward-geocoding-input > .v-input__control > .v-field {
    border-radius: var(--border-radius);
  }
  
  .forward-geocoding-input.geocode-success label {
    opacity: 1;
  }
  
  .forward-geocoding-input-small label {
    // .v-label sets default to 1rem
    font-size: 0.8rem;
  }

  .forward-geocoding-input-row {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 10px;
    align-items: center;
  }
  
  .geocoding-search-icon {
    padding-inline: calc(0.3 * var(--default-line-height));
    padding-block: calc(0.4 * var(--default-line-height));
  }

  .geocoding-search-icon:hover, #geocoding-close-icon:hover {
    cursor: pointer;
  }

}
</style>
