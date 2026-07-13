import { Map } from 'maplibre-gl';
/** 
 * Utitlity function for downloading canvas content as an image file.
 */
type ImageFormats = 'png' | 'jpeg';
export function downloadCanvasToImage(canvas: HTMLCanvasElement, filename: string = 'canvas_image', format: ImageFormats = 'png') {
  console.log('Downloading canvas to image...');
  const dataUrl = canvas.toDataURL(`image/${format}`);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadMap(map: Map, name = 'tempo-map', format: ImageFormats = 'png') {
  if (!map) {
    alert('Map not ready yet!');
    return;
  }
  
  // use regex so that if name ends with .png, .jpeg, .jpg, strip it off
  name = name.replace(/\.(png|jpeg|jpg)$/i, '');
  
  const html = map.getCanvas();
  console.log('Downloading map image...', html);
  // see: https://stackoverflow.com/a/78283389/11594175
  map.once('render', () => {
    // do this once when we render
    downloadCanvasToImage(html, name, format);
  });
  map.redraw(); // render now!
  
}