import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { get as getProjection } from 'ol/proj';

@Component({
  selector: 'app-cairgis-map-display',
  standalone: true,
  templateUrl: './cairgis-map-display.html',
  styleUrl: './cairgis-map-display.css',
})
export class CairgisMapDisplayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true })
  private mapElement!: ElementRef<HTMLDivElement>;

  private map?: Map;

  readonly cairgisUrl = 'https://192.24.10.209:8080/IGIST/ids/cairgis';
  readonly cairgisLayer = '100,Satellite';
  readonly projectionCode = 'EPSG:4326';
  readonly matrixIds = Array.from({ length: 16 }, (_, index) => `${this.projectionCode}:${index}`);
  readonly resolutions = [
    0.703125, 0.3515625, 0.17578125, 0.087890625,
    0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625,
    0.00274658203125, 0.001373291015625, 0.0006866455078125,
    0.00034332275390625, 0.000171661376953125, 0.0000858306884765625,
    0.00004291534423828125, 0.000021457672119140625
  ];

  ngAfterViewInit(): void {
    const projection = getProjection(this.projectionCode);

    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [this.createCairgisLayer()],
      view: new View({
        projection: this.projectionCode,
        center: [78, 22],
        zoom: 5,
        minZoom: 1,
        maxZoom: 15,
      }),
    });

    if (!projection) {
      console.error(`OpenLayers projection ${this.projectionCode} is unavailable.`);
    }
  }

  private createCairgisLayer(): TileLayer<WMTS> {
    return new TileLayer({
      source: new WMTS({
        url: this.cairgisUrl,
        layer: this.cairgisLayer,
        style: '',
        format: 'image/jpg',
        matrixSet: this.projectionCode,
        projection: this.projectionCode,
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: [-180, 90],
          resolutions: this.resolutions,
          matrixIds: this.matrixIds,
          tileSize: [256, 256],
        }),
      }),
    });
  }

  ngOnDestroy(): void {
    this.map?.setTarget(undefined);
    this.map = undefined;
  }
}