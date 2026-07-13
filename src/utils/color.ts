// https://davidmathlogic.com/colorblind 
export const paulTolMutedColorblindSafeColors = ['#CC6677', '#332288', '#117733', '#882255', '#44aa99', '#999933', '#aa4499',];
export const wongColorblindSafeColors = ['#009E73', '#56B4E9', '#CC79A7', '#D55E00','#F0E442', '#0072B2', '#E69F00']; 

export const COLORS = [
  ...wongColorblindSafeColors,
  ...paulTolMutedColorblindSafeColors,
  '#e6194b', '#3cb44b', '#4363d8', '#911eb4', '#46f0f0',
  '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8',
  '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff',
  '#000000'
];


export function contrastingColor(hexColor: string): string {
  const h = hexColor.slice(1); // remove the #
  const r = parseInt(h.substring(0, 2), 16) / 255.0;
  const g = parseInt(h.substring(2, 4), 16) / 255.0;
  const b = parseInt(h.substring(4, 6), 16) / 255.0;
  // https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
  const c = (v: number) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);

  // create a console log the previews the color choice as PREVIEW with background color the hexColor and text color the chosen contrasting color
  // console.log(`%c PREVIEW `, `background: ${hexColor}; color: ${lum > 0.179 ? '#000000' : '#FFFFFF'}`);

  return lum > 0.179 ? '#000000' : '#FFFFFF';
}