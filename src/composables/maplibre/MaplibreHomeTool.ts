import { IControl, Map } from "maplibre-gl";
import { LngLatPair } from "@/types";

export class CDSMaplibreHomeTool implements IControl {
  private _container: HTMLElement | undefined;
  private _button: HTMLButtonElement | undefined;
  private _homeIcon: HTMLImageElement | undefined;
  private _map: Map | undefined;
  private _centerLonLat: [number, number];
  private _zoom: number;
  private _onHome: CallableFunction;
    
  constructor(centerLonLat: LngLatPair, zoom: number, onHome: CallableFunction ) {
    this._centerLonLat = centerLonLat;
    this._zoom = zoom;
    this._onHome = onHome;
  }
    
  onAdd(map: Map): HTMLElement {
    
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group maplibre-control-cds-home';
    
    this._button = document.createElement('button');
    this._button.className = 'maplibregl-ctrl-icon maplibre-control-cds-home-button';
    this._button.type = 'button';
    this._button.title = 'Home';
    this._button.addEventListener('click', this._goHome.bind(this));
    
    this._homeIcon = document.createElement('img');
    this._homeIcon.style.padding = '5px';
    // SVG icon from Font Awesome https://fontawesome.com/icons/house?f=classic&s=solid (free one)
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>';
    this._homeIcon.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    
    this._button.appendChild(this._homeIcon);
    this._container.appendChild(this._button);
    
    return this._container;
  }
  
  onRemove(): void {
    // remove the event listener & element
    this._container?.removeEventListener('click', this._goHome);
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
  
  _goHome() {
    if (this._map) {
      this._map.flyTo({
        center: this._centerLonLat,
        zoom: this._zoom
      });
      this._onHome();
    }
  }
    
    
}