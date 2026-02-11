export class CameraService {
  private static instance: CameraService;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Initialize camera
   */
  async initializeCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement = videoElement;
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
        videoElement.onerror = reject;
      });
    } catch (error) {
      console.error('Camera initialization error:', error);
      throw new Error('Failed to access camera. Please ensure you have granted camera permissions.');
    }
  }

  /**
   * Capture photo from video stream
   */
  capturePhoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement || !this.stream) {
        reject(new Error('Camera not initialized'));
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        // Draw video frame to canvas
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (error) {
        console.error('Photo capture error:', error);
        reject(new Error('Failed to capture photo'));
      }
    });
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Check camera permissions
   */
  async checkCameraPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'camera' });
      return permission.state;
    } catch (error) {
      console.error('Camera permission check error:', error);
      return 'prompt';
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission request error:', error);
      return false;
    }
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  }

  /**
   * Switch camera (if multiple available)
   */
  async switchCamera(videoElement: HTMLVideoElement, deviceId?: string): Promise<void> {
    this.stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
        videoElement.onerror = reject;
      });
    } catch (error) {
      console.error('Camera switch error:', error);
      throw new Error('Failed to switch camera');
    }
  }

  /**
   * Validate photo quality
   */
  validatePhotoQuality(photoDataUrl: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Create image element to check dimensions
      const img = new Image();
      img.src = photoDataUrl;
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Check minimum dimensions
          if (img.width < 400 || img.height < 400) {
            issues.push('Photo resolution is too low');
            suggestions.push('Ensure good lighting and hold camera steady');
          }

          // Check aspect ratio (should be roughly portrait)
          const aspectRatio = img.width / img.height;
          if (aspectRatio < 0.6 || aspectRatio > 1.2) {
            issues.push('Photo aspect ratio is not ideal');
            suggestions.push('Hold phone in portrait orientation');
          }

          // Estimate file size from data URL
          const base64Length = photoDataUrl.length - 'data:image/jpeg;base64,'.length;
          const fileSize = Math.round(base64Length * 0.75); // Rough estimate
          
          if (fileSize < 50000) { // Less than 50KB
            issues.push('Photo file size is too small');
            suggestions.push('Move closer to camera or improve lighting');
          }

          resolve({
            isValid: issues.length === 0,
            issues,
            suggestions
          });
        };

        img.onerror = () => {
          resolve({
            isValid: false,
            issues: ['Failed to load photo'],
            suggestions: ['Try capturing the photo again']
          });
        };
      });
    } catch (error) {
      return Promise.resolve({
        isValid: false,
        issues: ['Failed to validate photo'],
        suggestions: ['Try capturing the photo again']
      });
    }
  }

  /**
   * Get camera capabilities
   */
  async getCameraCapabilities(): Promise<MediaTrackCapabilities | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      return capabilities;
    } catch (error) {
      console.error('Error getting camera capabilities:', error);
      return null;
    }
  }
}

export const cameraService = CameraService.getInstance();
