import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteOption {
  name: string;
  distance: string;
  distanceKm: number;
  duration: string;
  durationMin: number;
  traffic: 'Very Low' | 'Low' | 'Medium' | 'High';
  trafficDelay: number;
  recommended: boolean;
  coordinates: [number, number][];
  color: string;
}

export interface SavedRoute {
  _id?: string;
  name: string;
  start: MapLocation;
  destination: MapLocation;
  waypoints: MapLocation[];
  distance: string;
  duration: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class RoutePlannerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/routes';
  private osrmUrl = 'https://router.project-osrm.org/route/v1/driving';

  // ==========================================
  // GET ROUTE (With Fallback Mechanism)
  // ==========================================
  getRoute(
    start: MapLocation,
    end: MapLocation,
    waypoints: MapLocation[] = []
  ): Observable<any> {
    const points = [start, ...waypoints, end]
      .map(p => `${p.lng},${p.lat}`)
      .join(';');

    const url = `${this.osrmUrl}/${points}?overview=full&geometries=geojson&alternatives=true`;

    return this.http.get(url).pipe(
      catchError((err) => {
        console.warn('OSRM Routing API failed. Using simulated fallback route.', err);
        // Agar real API fail ho, toh straight line aur estimated time return karo
        return of(this.generateFallbackRoute(start, end, waypoints));
      })
    );
  }

  // ==========================================
  // FALLBACK GENERATOR (Agar API down ho)
  // ==========================================
  private generateFallbackRoute(start: MapLocation, end: MapLocation, waypoints: MapLocation[]) {
    const coords = [];
    coords.push([start.lng, start.lat]);
    waypoints.forEach(w => coords.push([w.lng, w.lat]));
    coords.push([end.lng, end.lat]);

    // Calculate straight line distance (Haversine formula)
    const distKm = this.calculateDistance(start.lat, start.lng, end.lat, end.lng);
    const roadDistKm = distKm * 1.3; // Road distance is usually ~30% more than straight line
    const durationSec = (roadDistKm / 50) * 3600; // Assume 50km/hr average speed

    return {
      routes: [
        {
          distance: roadDistKm * 1000, // in meters
          duration: durationSec, // in seconds
          geometry: { coordinates: coords }
        }
      ]
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  }

  // ==========================================
  // GEOCODING (Search Places)
  // ==========================================
  geocode(query: string): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
    return this.http.get(url, { headers: { 'Accept-Language': 'en' } });
  }

  // ==========================================
  // SAVED ROUTES API
  // ==========================================
  getSavedRoutes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  saveRoute(route: any): Observable<any> {
    return this.http.post(this.apiUrl, route);
  }

  deleteRoute(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // SIMULATE TRAFFIC & FORMAT DATA
  // ==========================================
  simulateTrafficData(routes: any[]): RouteOption[] {
    const trafficLevels: Array<'Very Low' | 'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High', 'Very Low'];
    const routeNames = ['Fastest Route', 'Alternative Route 1', 'Alternative Route 2'];
    const colors = ['#ef4444', '#3b82f6', '#f59e0b']; // Red, Blue, Orange

    return routes.map((route: any, index: number) => {
      const traffic = trafficLevels[index % trafficLevels.length];
      const delayMap = { 'Very Low': 0, 'Low': 5, 'Medium': 15, 'High': 30 };
      const trafficDelay = delayMap[traffic];

      const distanceKm = Math.round(route.distance / 1000);
      const durationMin = Math.round(route.duration / 60) + trafficDelay;

      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      // Extract coordinates (GeoJSON [lng, lat] to Leaflet [lat, lng])
      const coordinates: [number, number][] = route.geometry?.coordinates?.map(
        (c: number[]) => [c[1], c[0]] as [number, number]
      ) || [];

      return {
        name: routeNames[index] || `Route ${index + 1}`,
        distance: `${distanceKm} km`,
        distanceKm,
        duration: durationStr,
        durationMin,
        traffic,
        trafficDelay,
        recommended: index === 0,
        coordinates,
        color: colors[index] || '#6366f1',
      };
    });
  }
}