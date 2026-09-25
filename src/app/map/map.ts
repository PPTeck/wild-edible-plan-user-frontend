import {
  Component,
  AfterViewInit,
  OnInit,
  PLATFORM_ID,
  inject
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

import { TranslateService } from '@ngx-translate/core';

import { MapService } from '../services/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrls: ['./map.css'],
})
export class MapComponent implements OnInit, AfterViewInit {

  currentLanguage: 'en' | 'hi' = 'en';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private mapService: MapService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage =
        sessionStorage.getItem('selectedLanguage') as 'en' | 'hi' | null;

      this.currentLanguage = savedLanguage ?? 'en';

      this.translate.use(this.currentLanguage);
    }
  }

  toggleLanguage(): void {
    this.currentLanguage =
      this.currentLanguage === 'en' ? 'hi' : 'en';

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(
        'selectedLanguage',
        this.currentLanguage
      );
    }

    this.translate.use(this.currentLanguage);
  }

  ngAfterViewInit(): void {
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),   // OpenStreetMap — no server needed
      ],
      view: new View({
        center: fromLonLat([78, 26]),   // India centre (WebMercator)
        zoom: 5,
      }),
    });

    this.mapService.registerMap(map);
  }
}