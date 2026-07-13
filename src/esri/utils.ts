import { extractTimeSteps, fetchEsriTimeSteps, VariableNames } from "./ImageLayerConfig";

import type { MoleculeType } from "@/types";
export type { MoleculeType } from "@/types";

// The two data set versions cover different time periods (V03 is earlier than V04)

export const ESRI_URLS_V03: Record<MoleculeType, { url: string; variable: VariableNames }> = {
  'no2': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C2930763263-LARC_CLOUD/TEMPO_NO2_L3_V03_HOURLY_TROPOSPHERIC_VERTICAL_COLUMN/ImageServer",
    variable: "NO2_Troposphere",
  },
  // 'no2Monthly': {
  //   url: "https://gis.earthdata.nasa.gov/gp/rest/services/Hosted/TEMPO_NO2_L3_V03_Monthly_Mean/ImageServer",
  //   variable: "NO2_Troposphere",
  // },
  // 'no2DailyMax' : {
  //   url: "https://gis.earthdata.nasa.gov/gp/rest/services/Hosted/TEMPO_NO2_L3_V03_Daily_Maximum/ImageServer",
  //   variable: "NO2_Troposphere",
  // },
  'o3': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C2930764281-LARC_CLOUD/TEMPO_O3TOT_L3_V03_HOURLY_OZONE_COLUMN_AMOUNT/ImageServer",
    variable: "Ozone_Column_Amount",
  },
  'hcho': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C2930761273-LARC_CLOUD/TEMPO_HCHO_L3_V03_HOURLY_VERTICAL_COLUMN/ImageServer",
    variable: "HCHO",
  },
  // 'hchoMonthly': {
  //   url: "https://gis.earthdata.nasa.gov/gp/rest/services/Hosted/TEMPO_HCHO_L3_V03_Monthly_Mean/ImageServer",
  //   variable: "HCHO",
  // },
  // 'hchoDailyMax': {
  //   url: "https://gis.earthdata.nasa.gov/gp/rest/services/Hosted/TEMPO_HCHO_L3_V03_Daily_Maximum/ImageServer",
  //   variable: "HCHO",
  // },
} as const;

export const ESRI_URLS_V04: Record<MoleculeType, { url: string; variable: VariableNames }> = {
  'no2': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C3685896708-LARC_CLOUD/TEMPO_NO2_L3_V04_HOURLY_TROPOSPHERIC_VERTICAL_COLUMN/ImageServer",
    variable: "NO2_Troposphere",
  },
  'o3': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C3685896625-LARC_CLOUD/TEMPO_O3TOT_L3_V04_HOURLY_OZONE_COLUMN_AMOUNT/ImageServer",
    variable: "Ozone_Column_Amount",
  },
  'hcho': {
    url: "https://gis.earthdata.nasa.gov/image/rest/services/C3685897141-LARC_CLOUD/TEMPO_HCHO_L3_V04_HOURLY_VERTICAL_COLUMN/ImageServer",
    variable: "HCHO",
  },
} as const;

export const ESRI_URL_LIST = [ESRI_URLS_V03, ESRI_URLS_V04]; // in chronological order

export const MOLECULE_OPTIONS: {title: string, value: MoleculeType }[] = [
  { title: 'NO₂', value: 'no2' },
  // { title: 'Monthly Mean NO₂', value: 'no2Monthly' },
  // { title: 'Daily Max NO₂', value: 'no2DailyMax' },
  { title: 'O₃', value: 'o3' },
  { title: 'HCHO', value: 'hcho' },
  // { title: 'Monthly Mean HCHO', value: 'hchoMonthly' },
  // { title: 'Daily Max HCHO', value: 'hchoDailyMax' },
] as const;

export interface MoleculeDescriptor {
    fullName: {text: string, html: string},
    shortName: {text: string, html: string},
    unit: {text: string, html: string},
    shortUnit: {text: string, html: string},
  }

/**
 * @type Record<MoleculeType, MoleculeDescriptor>
 */
export const MOLECULE_NAMES: Record<MoleculeType, MoleculeDescriptor>  = {
  no2: {
    fullName: {text: 'Nitrogen Dioxide', html: 'Nitrogen Dioxide'},
    shortName: {text: 'NO₂', html: 'NO<sub>2</sub>'},
    unit: {text: 'molecules/cm²', html: "Molecules / cm<sup>2</sup>"},
    shortUnit: {text: 'mol./cm²', html: "mol./cm<sup>2</sup>"},
  },
  o3: {
    fullName: {text: 'Ozone', html: 'Ozone'},
    shortName: {text: 'O₃', html: 'O<sub>3</sub>'},
    unit: {text: 'Dobson Units', html: 'Dobson Units'},
    shortUnit: {text: 'DU', html: 'DU'},
  },
  hcho: {
    fullName: {text: 'Formaldehyde', html: 'Formaldehyde'},
    shortName: {text: 'HCHO', html: 'HCHO'},
    unit: {text: 'molecules/cm²', html: "Molecules / cm<sup>2</sup>"},
    shortUnit: {text: 'mol./cm²', html: "mol./cm<sup>2</sup>"},
  }, 
} as const;

export function moleculeDescriptor(molecule: MoleculeType): MoleculeDescriptor {
  if (molecule && molecule.toLowerCase() in MOLECULE_NAMES) {
    return MOLECULE_NAMES[molecule.toLowerCase()];
  }
  throw new Error(`Unknown molecule type: ${molecule}`);
}

export function moleculeYAxisTitle(descriptor: MoleculeDescriptor): string {
  const unitText = descriptor.unit.text.toLowerCase();
  const isColumnDensity = unitText.toLowerCase().includes('molecules');

  if (isColumnDensity) {
    return `Molecules of ${descriptor.shortName.html} / cm<sup>2</sup>`;
  }

  return `${descriptor.shortName.html} (${descriptor.unit.html})`;
}


export function moleculeName(molecule: MoleculeType): string {
  return MOLECULE_OPTIONS.find(m => m.value == molecule)?.title ?? "";
}

export async function getEsriTimesteps(url: string, variable: VariableNames): Promise<number[]> {
  return fetchEsriTimeSteps(url, variable).then(extractTimeSteps);
}
