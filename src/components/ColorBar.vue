
<template>
<div :id="id" class="colorbar-container">
  <div 
    :style="{'--background-color': backgroundColor}"
    class="colorbar">
  </div>
  <div class="colorbar-labels"> 
    <div><slot name="start">{{ startValue }}</slot></div>
    <div>
      <slot name="label">{{ label }}</slot>
    </div>
    <div><slot name="end">{{ endValue }}</slot></div>
  </div>
</div>
</template>



<script lang="ts">
import { defineComponent, PropType } from 'vue';

// type for a function that maps to either a  (color, opacity) pair or just a color
type ColorFunction = (x: number) => string;
type ExtendType = boolean | 'start' | 'end' | 'both';

export default defineComponent({
  name: 'ColorBar',
  props: {
    
    name: {
      type: String,
      default: null
    },
    
    cmapName: {
      type: String,
      default: 'none'
    },
    nsteps: {
      type: Number,
      default: 20
    },
    label: {
      type: String,
      default: 'Colorbar'
    },
    
    cmap: {
      type: Function as PropType<ColorFunction>,
      default: (x: number) => `rgb(255,0,${x * 255})`
    },
    
    backgroundColor: {
      type: String,
      default: '#5c5229'
    },
    
    startValue: {
      type: String,
      default: '0%'
    },
    
    endValue: {
      type: String,
      default: '100%'
    },
    
    extend: {
      type: (Boolean || String) as PropType<ExtendType>,
      default: () => 'both'
    }
    
  },
  
  
  mounted() {
    this.colorbarGradient();
  },
  
  computed: {
    id() {
      return this.name ? `colorbar-${this.name}` : `colorbar-${Math.random().toString(36).slice(2)}`;
    },
    
    triangles() {
      return this.extend !== false;
    },
    
    showStartTriangle() {
      return this.extend === 'both' || this.extend === 'start' || this.extend;
    },
    
    showEndTriangle() {
      return this.extend === 'both' || this.extend === 'end' || this.extend;
    }
  },
  
  
  
  methods: {
    
    cssLinearGradientFromCmap() {
      const n = this.nsteps;
      const colors = Array.from({length: n+1}, (_, i) => {
        const co = this.cmap(i/n);
        const [color, _opacity] = Array.isArray(co) ? co : [co,1];
        return `${color} ${i*100/n}%`;
      });
      return `linear-gradient(to top, ${colors.join(', ')})`;
    },
    
    colorbarGradient() {
      const colorbar = document.querySelector('#' + this.id + '> .colorbar');
      if (!colorbar) {
        return;
      }
      // remove all the children of the colorbar
      while (colorbar.firstChild) {
        colorbar.removeChild(colorbar.firstChild);
      }
      const div = document.createElement('div');
      div.className = 'colorbar-chunk';
      div.style.background = this.cssLinearGradientFromCmap();
      div.style.height = '100%';
      
      
      // add the start and end triangles
      if (this.triangles) {
        const start = document.createElement('div');
        start.className = 'colorbar-start';
        const end = document.createElement('div');
        end.className = 'colorbar-end';
        colorbar.appendChild(end);
        colorbar.appendChild(div);
        colorbar.appendChild(start);
      
        if (start && this.showStartTriangle) {
          start.style.backgroundColor = this.cmap(0);
          this.styleDownTriangle(start as HTMLDivElement);
        }
        if (end && this.showEndTriangle) {
          end.style.backgroundColor = this.cmap(1);
          this.styleUpTriangle(end as HTMLDivElement);
        }
      } else {
        colorbar.appendChild(div);
      }
    },
    
    styleUpTriangle(div: HTMLDivElement) {
      const width = div.offsetWidth;
      let height = div.offsetHeight;
      const color = div.style.backgroundColor;
      height = Math.min(Math.max(height, 15), 0.86 * width);
      div.style.backgroundColor = 'transparent';
      div.style.borderLeft = `${width/2}px solid transparent`;
      div.style.borderRight = `${width/2}px solid transparent`;
      div.style.borderBottom = `${height}px solid ${color}`;
    },
    
    styleDownTriangle(div: HTMLDivElement) {
      const width = div.offsetWidth;
      let height = div.offsetHeight;
      const color = div.style.backgroundColor;
      height = Math.min(Math.max(height, 15), 0.86 * width);
      div.style.backgroundColor = 'transparent';
      div.style.borderLeft = `${width/2}px solid transparent`;
      div.style.borderRight = `${width/2}px solid transparent`;
      div.style.borderTop = `${height}px solid ${color}`;
    }
  },
  
  watch: {
    nsteps() {
      this.colorbarGradient();
    },
    cmap() {
      this.colorbarGradient();
    },
    cmapName() {
      this.colorbarGradient();
    },
  }
  
});
</script>

<style scoped>
/*
* Prefixed by https://autoprefixer.github.io
* PostCSS: v8.4.14,
* Autoprefixer: v10.4.7
* Browsers: last 5 version
*/

.colorbar-container {
  position: relative;
  display: inline-block;
  --width: 1.25em;
  width: -webkit-fit-content;
  width: -moz-fit-content;
  width: fit-content;
  margin-left: 5px;
  margin-right: 1em;
  background: var(--background-color);
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}

.colorbar {
  height: 100%;
  width: var(--width);
  margin-left: 5px;
  margin-right: 1em;
  background: var(--background-color);
  display:-webkit-box;
  display:-ms-flexbox;
  display:flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-filter: drop-shadow(0 0 0.1rem white);
          filter: drop-shadow(0 0 0.1rem white);
}

/* make .colorbar-start and .colorbar-end triangles */
.colorbar-chunk {
  
  -ms-flex-negative: 1;
  
      flex-shrink: 1;
  -webkit-box-flex:1;
      -ms-flex-positive:1;
          flex-grow:1;
}

.colorbar-start {
  -ms-flex-preferred-size: min-content;
      flex-basis: min-content;
  -ms-flex-negative: 0;
      flex-shrink: 0;
  -webkit-box-flex:1;
      -ms-flex-positive:1;
          flex-grow:1;
}

.colorbar-end {
  -ms-flex-preferred-size: min-content;
      flex-basis: min-content;
  -ms-flex-negative: 0;
      flex-shrink: 0;
  -webkit-box-flex: 1;
      -ms-flex-positive: 1;
          flex-grow: 1;
}



.colorbar-labels {
  position: absolute;
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
  height: 100%;
  top: 50%;
  line-height: 1.75;
  /* right: -1.5ch; */
  -webkit-transform-origin: top center;
      -ms-transform-origin: top center;
          transform-origin: top center;
  -webkit-transform: rotate(180deg) translate(-100%,-50%);
      -ms-transform: rotate(180deg) translate(-100%,-50%);
          transform: rotate(180deg) translate(-100%,-50%);
  -webkit-writing-mode: vertical-rl;
      -ms-writing-mode: tb-rl;
          writing-mode: vertical-rl;
  
  display: -webkit-box;
  
  display: -ms-flexbox;
  
  display: flex;
  -webkit-box-pack: justify;
      -ms-flex-pack: justify;
          justify-content: space-between;
  }
</style>
