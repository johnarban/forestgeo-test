// algorithm to predict how esri will sample the region
import { RectBounds } from "../geometry";
import { EsriImageServiceSpec } from "../types";

export class EsriSampler {
  public metadata: EsriImageServiceSpec | undefined;
  public geometry: RectBounds | undefined;
  public serviceBounds: RectBounds;
  public pixelXSize: number;
  public pixelYSize: number;
  private serviceXsize: number;
  private serviceYsize: number;
  
    
  constructor(
    serviceMetaData: EsriImageServiceSpec, 
    geometry?: RectBounds
  ) {
    this.metadata = serviceMetaData;
    this.geometry = geometry;
    
    this.serviceBounds = {
      xmin: serviceMetaData.fullExtent.xmin,
      ymin: serviceMetaData.fullExtent.ymin,
      xmax: serviceMetaData.fullExtent.xmax,
      ymax: serviceMetaData.fullExtent.ymax
    };
    
    this.pixelXSize = serviceMetaData.pixelSizeX;
    this.pixelYSize = serviceMetaData.pixelSizeY;
    this.serviceXsize = this.serviceBounds.xmax - this.serviceBounds.xmin;
    this.serviceYsize = this.serviceBounds.ymax - this.serviceBounds.ymin;
  }
  
  setGeometry(geometry: RectBounds) {
    // this.geometry = {
    //   xmin: Math.min(geometry.xmin, geometry.xmax),
    //   ymin: Math.min(geometry.ymin, geometry.ymax),
    //   xmax: Math.max(geometry.xmin, geometry.xmax),
    //   ymax: Math.max(geometry.ymin, geometry.ymax)
    // };
    this.geometry = geometry; // we need to maintain the orientation
    // the orientation affects the sampling locations.
  }
  
  // not the geometry X and Y size are signed. 
  // It is not garunteed that xmax > xmin or ymax > ymin
  // The Esri Image ser
  get geometryXsize(): number {
    if (!this.geometry) {
      throw new Error('Geometry not set');
    }
    return (this.geometry.xmax - this.geometry.xmin);
  }
  
  get geometryYsize(): number {
    if (!this.geometry) {
      throw new Error('Geometry not set');
    }
    return (this.geometry.ymax - this.geometry.ymin);
  }
  
  setMetadata(serviceMetaData: EsriImageServiceSpec) {
    this.metadata = serviceMetaData;
    this.serviceBounds = {
      xmin: serviceMetaData.fullExtent.xmin,
      ymin: serviceMetaData.fullExtent.ymin,
      xmax: serviceMetaData.fullExtent.xmax,
      ymax: serviceMetaData.fullExtent.ymax
    }  ;
    this.pixelXSize = serviceMetaData.pixelSizeX;
    this.pixelYSize = serviceMetaData.pixelSizeY;
    this.serviceXsize = this.serviceBounds.xmax - this.serviceBounds.xmin;
    this.serviceYsize = this.serviceBounds.ymax - this.serviceBounds.ymin;
  }  
  
  get geometryAspectRatio(): number {
    if (!this.geometry) {
      throw new Error('Geometry not set');
    }
    const latSize = Math.abs(this.geometry.ymax - this.geometry.ymin);
    const lonSize = Math.abs(this.geometry.xmax - this.geometry.xmin);
    return lonSize / latSize;
  }
  
  get geometryArea(): number {
    if (!this.geometry) {
      throw new Error('Geometry not set');
    }
    const latSize = Math.abs(this.geometry.ymax - this.geometry.ymin);
    const lonSize = Math.abs(this.geometry.xmax - this.geometry.xmin);
    return latSize * lonSize;
  }
  
  getSampleDistance(sampleCount: number): number {
    return Math.sqrt(this.geometryArea) / Math.sqrt(sampleCount);
  }
  
  getSampleCount(sampleDistance: number): number {
    return this.geometryArea / (sampleDistance * sampleDistance);
  }
  
  get pixelSize(): number {
    return Math.sqrt(this.pixelXSize * this.pixelYSize);
  }
  
  calculateActualSampleCount(initialSampleCount: number): number {
    let sampleDistance = this.getSampleDistance(initialSampleCount);
    
    if (sampleDistance < this.pixelSize) {
      sampleDistance = this.pixelSize;
    }

    const nx = Math.round(Math.abs(this.geometryXsize) / sampleDistance);
    const ny = Math.round(Math.abs(this.geometryYsize) / sampleDistance);
    const actualSampleCount = nx * ny;
    return actualSampleCount;
  }
  
  getSamplingSpecificationFromSamplingDistance(sampleDistance: number) {
    const nx = Math.round(Math.abs(this.geometryXsize) / sampleDistance);
    const ny = Math.round(Math.abs(this.geometryYsize) / sampleDistance);
    const count = nx * ny;
    return {
      count,
      distance: sampleDistance,
      lats: ny,
      lons: nx
    };
  }
  
  getSamplingSpecificationFromSampleCount(initialSampleCount: number, permitOversampling: boolean = false) {
    let sampleDistance = this.getSampleDistance(initialSampleCount);
    
    if ((sampleDistance < this.pixelSize) && !permitOversampling) {
      const adjustedSampleCount = this.getSamplingSpecificationFromSamplingDistance(this.pixelSize).count;
      sampleDistance = this.getSampleDistance(adjustedSampleCount);
    }

    return this.getSamplingSpecificationFromSamplingDistance(sampleDistance);
    
  }
  
  
  /** 
  Predict the sampling locations based on the geometry and metadata
  Returns an object with x and y arrays of sampling locations
  
  Esri seems to always sample starting from the upper-left corner.
  **/
  getSampleLocations(sampleCount: number) {
    if (!this.geometry) {
      throw new Error('Geometry not set');
    }

    const spec = this.getSamplingSpecificationFromSampleCount(sampleCount);
    const lats: number[] = [];
    const lons: number[] = [];
    const _ysign = Math.sign(this.geometryXsize);
    const _xsign = Math.sign(this.geometryXsize);
    
    // spacing function for each sample
    const delta = (i: number) => i * spec.distance + spec.distance / 2;

    for (let i = 0; i < spec.lats; i++) {
      lats.push(Math.max(this.geometry.ymin, this.geometry.ymax) - delta(i));
    }
    for (let j = 0; j < spec.lons; j++) {
      lons.push(Math.min(this.geometry.xmin, this.geometry.xmax) + delta(j));
    }
    return {x: lons, y: lats, spec: spec};
    
  }
  
  getSampleLocationsGrid(sampleCount: number) {
    const locations = this.getSampleLocations(sampleCount);
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < locations.x.length; i++) {
      for (let j = 0; j < locations.y.length; j++) {
        points.push({x: locations.x[i], y: locations.y[j]});
      }
    }
    return points;
  }
  
}