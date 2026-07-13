export type ColorMap = {r: number[], g: number[], b: number[]};

export interface ColorMaps {
    [key: string]: ColorMap;
}

type EsriColorRampAlgorithms = "esriHSVAlgorithm" | "esriCIELabAlgorithm" | "esriLabLChAlgorithm";
type EsriAlpha = number;
type EsriRed = number;
type EsriGreen = number;
type EsriBlue = number;

export interface EsriColorRamp {
        "type": "algorithmic",
        "algorithm": EsriColorRampAlgorithms;
        "fromColor": [EsriRed, EsriGreen, EsriBlue, EsriAlpha];
        "toColor": [EsriRed, EsriGreen, EsriBlue, EsriAlpha];
        "start": number;
        "stop": number;
    }

export interface EsriMultiPartColorRamp {
    type: "multipart";
    colorRamps: EsriColorRamp[];
}
