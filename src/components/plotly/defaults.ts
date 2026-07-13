import { Layout, Config, ModeBarDefaultButtons } from "plotly.js-dist-min";

export const DEFAULT_PLOT_LAYOUT: Partial<Layout> = {
  dragmode: false,
  modebar: {
    color: "#808080",
    activecolor: "#009ade",  // Smithsonian blue
  },
  yaxis: {
    automargin: true,
    showline: true,
    mirror: true,
  },
  xaxis: {
    showline: true,
    mirror: true,
  },
  legend: {
    yanchor: 'top',
    yref: 'container',
    y: .95,
    orientation:'h' as |'h' | 'v',
    bordercolor: '#ccc', 
    borderwidth:1,
    // @ts-expect-error entrywidthmode is a valid value
    entrywidthmode: 'pixels',
    entrywidth: 0, // fit the text
  }
};

export const DEFAULT_MODEBAR_BUTTONS_TO_REMOVE: ModeBarDefaultButtons[] = ['sendDataToCloud', 'lasso2d', 'select2d', 'autoScale2d'];
export const DEFAULT_PLOT_CONFIG: Partial<Config> = {
  modeBarButtonsToRemove: DEFAULT_MODEBAR_BUTTONS_TO_REMOVE,
  displaylogo: false,
};
