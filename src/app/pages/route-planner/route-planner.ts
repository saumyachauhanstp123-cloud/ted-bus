import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import {
  RoutePlannerService,
  MapLocation,
  RouteOption,
  SavedRoute
} from '../../services/route-planner.service';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';

// Fix Leaflet default marker icons in Angular/Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'app-route-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './route-planner.html',
  styleUrl: './route-planner.css'
})
export class RoutePlanner implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private routeService = inject(RoutePlannerService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  authService = inject(AuthService);

  // Form
  startQuery = '';
  destQuery = '';
  waypointQueries: string[] = [];

  // Suggestions
  startSuggestions = signal<any[]>([]);
  destSuggestions = signal<any[]>([]);
  waypointSuggestions = signal<any[][]>([]);

  // Selected locations
  startLocation = signal<MapLocation | null>(null);
  destination = signal<MapLocation | null>(null);
  waypoints = signal<(MapLocation | null)[]>([]);

  // Routes
  routes = signal<RouteOption[]>([]);
  selectedRoute = signal<RouteOption | null>(null);
  selectedRouteIndex = signal(0);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Sort
  selectedSort = signal<'distance' | 'time' | 'traffic' | ''>('');

  // Saved
  savedRoutes = signal<SavedRoute[]>([]);
  savedLoading = signal(false);

  // Map
  private map!: L.Map;
  private routeLayers: L.Polyline[] = [];
  private markers: L.Marker[] = [];
  private trafficTimer: any = null;

  ngOnInit(): void {
    this.loadSavedRoutes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 150);
  }

  ngOnDestroy(): void {
    if (this.trafficTimer) clearInterval(this.trafficTimer);
    if (this.map) this.map.remove();
  }

  // =========================
  // MAP
  // =========================
  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  private clearMap(): void {
    this.routeLayers.forEach(l => this.map.removeLayer(l));
    this.routeLayers = [];
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
  }

  private addMarker(lat: number, lng: number, label: string): void {
    const marker = L.marker([lat, lng]).addTo(this.map).bindPopup(label);
    this.markers.push(marker);
    this.map.setView([lat, lng], 11);
  }
    private drawRoutes(routes: RouteOption[]): void {
    this.clearMap();

    if (this.startLocation()) {
      this.addMarker(this.startLocation()!.lat, this.startLocation()!.lng, 'Start');
    }
    if (this.destination()) {
      this.addMarker(this.destination()!.lat, this.destination()!.lng, 'Destination');
    }

    routes.forEach((route, index) => {
      if (!route.coordinates?.length) return;

      const line = L.polyline(route.coordinates, {
        color: route.color,
        weight: index === 0 ? 6 : 4,
        opacity: index === 0 ? 0.9 : 0.55
      }).addTo(this.map);

      // 🔥 NAYA CODE: Route ke beech mein (Midpoint) Label dikhane ke liye
      if (index === 0) { // Sirf selected/best route par label dikhayenge taaki map saaf rahe
        const midPointIndex = Math.floor(route.coordinates.length / 2);
        const midPoint = route.coordinates[midPointIndex];

        if (midPoint) {
          const label = L.marker(midPoint, {
            icon: L.divIcon({
              className: 'custom-route-label',
              html: `
                <div style="
                  background: white; 
                  padding: 6px 12px; 
                  border-radius: 20px; 
                  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                  font-weight: bold;
                  font-size: 12px;
                  color: #1f2937;
                  white-space: nowrap;
                  border: 2px solid ${route.color};
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  <span>⏱ ${route.duration}</span>
                  <span style="color: #9ca3af;">•</span>
                  <span>📍 ${route.distance}</span>
                </div>
              `,
              iconSize: [150, 30],
              iconAnchor: [75, 15]
            })
          }).addTo(this.map);

          this.markers.push(label); // Isko bhi clear karne ke liye array mein daal do
        }
      }

      line.bindPopup(
        `<b>${route.name}</b><br>` +
        `📍 ${route.distance}<br>` +
        `⏱ ${route.duration}<br>` +
        `🚦 ${route.traffic}`
      );

      this.routeLayers.push(line);
    });

    if (routes[0]?.coordinates?.length) {
      this.map.fitBounds(L.latLngBounds(routes[0].coordinates), { padding: [40, 40] });
    }
  }
    selectRoute(route: RouteOption, index: number): void {
    this.selectedRoute.set(route);
    this.selectedRouteIndex.set(index);

    this.routeLayers.forEach((layer, i) => {
      layer.setStyle({
        weight: i === index ? 6 : 3,
        opacity: i === index ? 0.95 : 0.4
      });
    });

    // 🔥 Jab route change ho, poora map dubara draw karo taaki naya label sahi jagah par aaye
    this.drawRoutes(this.routes()); 
    
    // Selected index ko update karke usko highlight karo
    this.selectedRoute.set(route);
    this.selectedRouteIndex.set(index);


    if (route.coordinates?.length) {
      this.map.fitBounds(L.latLngBounds(route.coordinates), { padding: [40, 40] });
    }
  }
  // =========================
  onStartInput(): void {
    if (this.startQuery.trim().length < 3) {
      this.startSuggestions.set([]);
      return;
    }
    this.routeService.geocode(this.startQuery).subscribe({
      next: (res: any) => this.startSuggestions.set((res as any[]).slice(0, 6)),
      error: () => this.startSuggestions.set([])
    });
  }

  onDestInput(): void {
    if (this.destQuery.trim().length < 3) {
      this.destSuggestions.set([]);
      return;
    }
    this.routeService.geocode(this.destQuery).subscribe({
      next: (res: any) => this.destSuggestions.set((res as any[]).slice(0, 6)),
      error: () => this.destSuggestions.set([])
    });
  }

  onWaypointInput(index: number): void {
    const q = this.waypointQueries[index] || '';
    if (q.trim().length < 3) {
      const arr = [...this.waypointSuggestions()];
      arr[index] = [];
      this.waypointSuggestions.set(arr);
      return;
    }

    this.routeService.geocode(q).subscribe({
      next: (res: any) => {
        const arr = [...this.waypointSuggestions()];
        arr[index] = (res as any[]).slice(0, 5);
        this.waypointSuggestions.set(arr);
      },
      error: () => {}
    });
  }

  selectStart(s: any): void {
    this.startQuery = s.display_name.split(',')[0];
    this.startLocation.set({
      name: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon)
    });
    this.startSuggestions.set([]);
    this.addMarker(parseFloat(s.lat), parseFloat(s.lon), 'Start');
  }

  selectDest(s: any): void {
    this.destQuery = s.display_name.split(',')[0];
    this.destination.set({
      name: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon)
    });
    this.destSuggestions.set([]);
    this.addMarker(parseFloat(s.lat), parseFloat(s.lon), 'Destination');
  }

  selectWaypoint(index: number, s: any): void {
    this.waypointQueries[index] = s.display_name.split(',')[0];
    const wp: MapLocation = {
      name: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon)
    };
    const list = [...this.waypoints()];
    list[index] = wp;
    this.waypoints.set(list);

    const arr = [...this.waypointSuggestions()];
    arr[index] = [];
    this.waypointSuggestions.set(arr);
  }

  // =========================
  // WAYPOINTS
  // =========================
  addWaypoint(): void {
    this.waypointQueries.push('');
    this.waypoints.update(w => [...w, null]);
    this.waypointSuggestions.update(s => [...s, []]);
  }

  removeWaypoint(index: number): void {
    this.waypointQueries.splice(index, 1);
    this.waypoints.update(w => w.filter((_, i) => i !== index));
    this.waypointSuggestions.update(s => s.filter((_, i) => i !== index));
  }

  // =========================
  // SEARCH ROUTES
  // =========================
  searchRoutes(): void {
    if (!this.startLocation() || !this.destination()) {
      this.errorMessage.set(
        this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.SELECT_LOCATIONS')
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.routes.set([]);
    this.selectedRoute.set(null);

    const validWaypoints = this.waypoints().filter((w): w is MapLocation => !!w);

    this.routeService
      .getRoute(this.startLocation()!, this.destination()!, validWaypoints)
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);

          if (!res?.routes?.length) {
            this.errorMessage.set(
              this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.NO_ROUTES')
            );
            return;
          }

          const processed = this.routeService.simulateTrafficData(res.routes);
          this.routes.set(processed);
          this.selectedRoute.set(processed[0]);
          this.selectedRouteIndex.set(0);
          this.drawRoutes(processed);
          this.startTrafficUpdates();
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.errorMessage.set(
            this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.FETCH_FAILED')
          );
        }
      });
  }

  // =========================
  // SORT
  // =========================
  sortRoutes(by: 'distance' | 'time' | 'traffic'): void {
    this.selectedSort.set(by);
    const list = [...this.routes()];

    if (by === 'distance') list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (by === 'time') list.sort((a, b) => a.durationMin - b.durationMin);
    if (by === 'traffic') {
      const order: any = { 'Very Low': 1, Low: 2, Medium: 3, High: 4 };
      list.sort((a, b) => order[a.traffic] - order[b.traffic]);
    }

    this.routes.set(list);
    if (list.length) {
      this.selectRoute(list[0], 0);
    }
  }

  // =========================
  // TRAFFIC LIVE UPDATE (simulated)
  // =========================
  private startTrafficUpdates(): void {
    if (this.trafficTimer) clearInterval(this.trafficTimer);

    this.trafficTimer = setInterval(() => {
      const levels: Array<'Very Low' | 'Low' | 'Medium' | 'High'> = [
        'Very Low',
        'Low',
        'Medium',
        'High'
      ];

      const updated = this.routes().map((r) => {
        const traffic = levels[Math.floor(Math.random() * levels.length)];
        const delayMap: any = { 'Very Low': 0, Low: 5, Medium: 12, High: 25 };
        const delay = delayMap[traffic];
        const totalMin = Math.max(1, r.durationMin - (r.trafficDelay || 0) + delay);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;

        return {
          ...r,
          traffic,
          trafficDelay: delay,
          durationMin: totalMin,
          duration: h > 0 ? `${h}h ${m}m` : `${m}m`
        };
      });

      this.routes.set(updated);
      const selected = updated[this.selectedRouteIndex()] || updated[0];
      this.selectedRoute.set(selected || null);
    }, 30000);
  }

  // =========================
  // SAVE / LOAD
  // =========================
  saveRoute(): void {
    if (!this.startLocation() || !this.destination()) {
      this.errorMessage.set(
        this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.SEARCH_FIRST')
      );
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage.set(
        this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.LOGIN_REQUIRED')
      );
      return;
    }

    const selected = this.selectedRoute();
    const payload = {
      name: `${this.startQuery} → ${this.destQuery}`,
      start: this.startLocation()!,
      destination: this.destination()!,
      waypoints: this.waypoints().filter((w): w is MapLocation => !!w),
      distance: selected?.distance || '',
      duration: selected?.duration || ''
    };

    this.routeService.saveRoute(payload).subscribe({
      next: (res: any) => {
  this.savedRoutes.update((list) => [res.route, ...list]);
  this.toast.success(this.translate.instant('ROUTE_PLANNER_PAGE.SUCCESS.SAVED'));
},
error: (err) => {
  this.toast.error(
    err?.error?.message ||
    this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.SAVE_FAILED')
  );
}
    });
  }

  loadSavedRoutes(): void {
    if (!this.authService.isLoggedIn()) return;

    this.savedLoading.set(true);
    this.routeService.getSavedRoutes().subscribe({
      next: (res: any) => {
        this.savedRoutes.set(res.routes || []);
        this.savedLoading.set(false);
      },
      error: () => {
        this.savedRoutes.set([]);
        this.savedLoading.set(false);
      }
    });
  }

  loadSavedRoute(route: SavedRoute): void {
    this.startQuery = route.start.name.split(',')[0];
    this.destQuery = route.destination.name.split(',')[0];
    this.startLocation.set(route.start);
    this.destination.set(route.destination);
    this.waypoints.set(route.waypoints || []);
    this.waypointQueries = (route.waypoints || []).map((w) => w.name.split(',')[0]);
    this.searchRoutes();
  }

  deleteSavedRoute(id: string): void {
    this.routeService.deleteRoute(id).subscribe({
      next: () => {
        this.savedRoutes.update((list) => list.filter((r) => r._id !== id));
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ||
          this.translate.instant('ROUTE_PLANNER_PAGE.ERRORS.DELETE_FAILED')
        );
      }
    });
  }

  // =========================
  // UI HELPERS
  // =========================
  getTrafficClass(traffic: string): string {
    const map: any = {
      'Very Low': 'bg-green-100 text-green-700',
      Low: 'bg-blue-100 text-blue-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-red-100 text-red-700'
    };
    return map[traffic] || 'bg-gray-100 text-gray-600';
  }

  getTrafficIcon(traffic: string): string {
    const map: any = {
      'Very Low': '🟢',
      Low: '🔵',
      Medium: '🟡',
      High: '🔴'
    };
    return map[traffic] || '⚪';
  }
}