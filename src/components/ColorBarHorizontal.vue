
<template>
<div
  :id="id" 
  class="colorbar-container-horizontal"
  :style="cssVars"
>
  <div class="colorbar-labels"> 
    <div><slot name="start">{{ startValue }}</slot></div>
    <div>
      <slot name="label">{{ label }}</slot>
    </div>
    <div><slot name="end">{{ endValue }}</slot></div>
  </div>
  <div 
    :style="{'--background-color': backgroundColor}"
    class="colorbar">
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
    },

    height: {
      type: String,
      default: "1.25em",
    },

    fontSize: {
      type: String,
      default: "10pt",
    },
    
  },
  
  
  mounted() {
    this.colorbarGradient();
    // console.log(this.$el);
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
    },

    cssVars() {
      return {
        "--height": this.height,
        "--font-size": this.fontSize,
      };
    },
  },
  
  
  
  methods: {
    
    cssLinearGradientFromCmap() {
      const n = this.nsteps;
      const colors = Array.from({length: n+1}, (_, i) => {
        const co = this.cmap(i/n);
        const [color, _opacity] = Array.isArray(co) ? co : [co,1];
        return `${color} ${i*100/n}%`;
      });
      return `linear-gradient(to right, ${colors.join(', ')})`;
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
      // const div = this.$el.querySelector('.colorbar-chunk');
      div.className = 'colorbar-chunk';
      div.style.background = this.cssLinearGradientFromCmap();
      div.style.height = 'var(--height)';
      div.style.width = '100%';
      
      
      // add the start and end triangles
      if (this.triangles) {
        const start = document.createElement('div');
        start.className = 'colorbar-start';
        const end = document.createElement('div');
        end.className = 'colorbar-end';
        colorbar.appendChild(start);
        colorbar.appendChild(div);
        colorbar.appendChild(end);
        end && this.showEndTriangle;
        if (start && this.showStartTriangle) {
          start.style.backgroundColor = this.cmap(0);
          this.styleLeftTriangle(start as HTMLDivElement);
        }
        if (end && this.showEndTriangle) {
          end.style.backgroundColor = this.cmap(1);
          this.styleRightTriangle(end as HTMLDivElement);
        }
      } else {
        colorbar.appendChild(div);
      }
    },
    
    styleColorbarChunk(div: HTMLDivElement) {
      div.style.background = this.cssLinearGradientFromCmap();
      div.style.height = 'var(--height)';
      div.style.flexGrow = '1';
      div.style.flexShrink = '1';
      
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
      div.style.flexShrink = '0';
      div.style.flexGrow = '1';
    },
    
    styleLeftTriangle(div: HTMLDivElement) {
      div.style.width="var(--height)";
      div.style.height="var(--height)";
      const height = div.offsetHeight;
      const color = div.style.backgroundColor;
      div.style.backgroundColor = 'transparent';
      
      div.style.borderTop = `${height/2}px solid transparent`;
      div.style.borderBottom = `${height/2}px solid transparent`;
      div.style.borderRight = `${height}px solid ${color}`;
    },
    
    styleRightTriangle(div: HTMLDivElement) {
      div.style.width="var(--height)";
      div.style.height="var(--height)";
      const height = div.offsetHeight;
      const color = div.style.backgroundColor;
      div.style.backgroundColor = 'transparent';
      
      div.style.borderTop = `${height/2}px solid transparent`;
      div.style.borderBottom = `${height/2}px solid transparent`;
      div.style.borderLeft = `${height}px solid ${color}`;
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
    }
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

.colorbar-container-horizontal {
  position: relative;
  display: block;
  width: 100%;
  font-size: var(--font-size);
}
.colorbar {
  width: 100%;
  height: var(--height);
  background: var(--background-color);
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-filter: drop-shadow(0 0 0.1rem white);
          filter: drop-shadow(0 0 0.1rem white);
}


.colorbar-labels {
  
  width: 100%;
  height: -webkit-max-content;
  height: -moz-max-content;
  height: max-content;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
      -ms-flex-pack: justify;
          justify-content: space-between;
}
</style>
