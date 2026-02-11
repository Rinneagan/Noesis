import { AttendanceLocation, ClassLocation } from '@/types';

export class LocationService {
  private static instance: LocationService;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current user location
   */
  async getCurrentLocation(): Promise<AttendanceLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: AttendanceLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Unknown error occurred';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for Geolocation';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if a location is within a geofence
   */
  isWithinGeofence(
    userLocation: AttendanceLocation,
    classLocation: ClassLocation
  ): boolean {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      classLocation.latitude,
      classLocation.longitude
    );

    return distance <= classLocation.radius;
  }

  /**
   * Get location accuracy level
   */
  getAccuracyLevel(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'fair';
    return 'poor';
  }

  /**
   * Watch location changes
   */
  watchLocation(callback: (location: AttendanceLocation) => void): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        const location: AttendanceLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        callback(location);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Get formatted address from coordinates (reverse geocoding)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Noesis-Attendance-System/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /**
   * Validate location for attendance
   */
  async validateLocationForAttendance(
    userLocation: AttendanceLocation,
    classLocation: ClassLocation
  ): Promise<{
    isValid: boolean;
    distance: number;
    accuracy: 'excellent' | 'good' | 'fair' | 'poor';
    address?: string;
    message: string;
  }> {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      classLocation.latitude,
      classLocation.longitude
    );

    const isWithinGeofence = this.isWithinGeofence(userLocation, classLocation);
    const accuracy = this.getAccuracyLevel(userLocation.accuracy);

    let message = '';
    if (!isWithinGeofence) {
      message = `You are ${Math.round(distance)}m away from the classroom. Please be within ${classLocation.radius}m to check in.`;
    } else if (accuracy === 'poor') {
      message = 'Location accuracy is poor. Please try again in a clearer area.';
    } else {
      message = 'Location verified successfully.';
    }

    const address = await this.reverseGeocode(
      userLocation.latitude,
      userLocation.longitude
    );

    return {
      isValid: isWithinGeofence && accuracy !== 'poor',
      distance,
      accuracy,
      address,
      message
    };
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.error('Permission query error:', error);
      return 'prompt';
    }
  }
}

export const locationService = LocationService.getInstance();
