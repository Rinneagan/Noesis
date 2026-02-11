/**
 * Browser utilities for handling camera and other device APIs
 */

export class BrowserUtils {
  /**
   * Check if browser supports required APIs
   */
  static checkBrowserSupport(): {
    camera: boolean;
    geolocation: boolean;
    webSocket: boolean;
    https: boolean;
  } {
    return {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      geolocation: !!navigator.geolocation,
      webSocket: typeof WebSocket !== 'undefined',
      https: location.protocol === 'https:' || location.hostname === 'localhost'
    };
  }

  /**
   * Get detailed browser info
   */
  static getBrowserInfo(): {
    name: string;
    version: string;
    isMobile: boolean;
    platform: string;
  } {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    let name = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari')) {
      name = 'Safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    }

    return {
      name,
      version,
      isMobile,
      platform: navigator.platform || 'Unknown'
    };
  }

  /**
   * Request camera permission with proper error handling
   */
  static async requestCameraPermission(): Promise<{
    granted: boolean;
    error?: string;
    stream?: MediaStream;
  }> {
    try {
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Camera API not supported in this browser'
        };
      }

      // Check if we're on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        return {
          granted: false,
          error: 'Camera access requires HTTPS connection'
        };
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      return {
        granted: true,
        stream
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found. Please connect a camera and try again.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera does not support the requested constraints.';
            break;
          case 'SecurityError':
            errorMessage = 'Camera access blocked due to security restrictions.';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        granted: false,
        error: errorMessage
      };
    }
  }

  /**
   * Request geolocation permission with proper error handling
   */
  static async requestGeolocationPermission(): Promise<{
    granted: boolean;
    error?: string;
    location?: GeolocationPosition;
  }> {
    try {
      if (!navigator.geolocation) {
        return {
          granted: false,
          error: 'Geolocation API not supported in this browser'
        };
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      return {
        granted: true,
        location: position
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'PermissionDeniedError':
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case 'PositionUnavailableError':
            errorMessage = 'Location information is unavailable.';
            break;
          case 'TimeoutError':
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        granted: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if we're in a secure context
   */
  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  }
}
