'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { CheckInRequest, QRCodeData } from '@/types';
import { qrService } from '@/lib/qr-service';
import { locationService } from '@/lib/location-service';
import { CheckCircle, Camera, MapPin, Shield, AlertCircle, X, CameraOff, QrCode } from 'lucide-react';
import PhotoVerification from './PhotoVerification';

interface QRScannerProps {
  onCheckIn: (request: CheckInRequest) => Promise<void>;
  studentId: string;
  onClose?: () => void;
}

export default function QRScanner({ onCheckIn, studentId, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [activeTab, setActiveTab] = useState<'qr' | 'photo'>('qr');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scanRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const checkPermissions = async () => {
    // Check camera permission
    const camPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    setCameraPermission(camPermission.state as 'granted' | 'denied' | 'prompt');

    // Check location permission
    try {
      const locPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setLocationPermission(locPermission.state as 'granted' | 'denied' | 'prompt');
    } catch (error) {
      setLocationPermission('prompt');
    }
  };

  const startScanning = async () => {
    if (!scanRegionRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        false // verbose
      );

      scannerRef.current.render(
        async (decodedText) => {
          await handleQRCodeScan(decodedText);
        },
        (error) => {
          // Handle scan errors silently
          console.warn('QR scan error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setIsScanning(false);
  };

  const handleQRCodeScan = async (decodedText: string) => {
    try {
      setError('');
      setIsVerifying(true);

      // Validate QR code
      const validatedQR = qrService.validateQRCode(decodedText);
      
      if (!validatedQR) {
        setError('Invalid or expired QR code');
        setIsVerifying(false);
        return;
      }

      setQrData(validatedQR);

      // Get current location
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);

      // Create check-in request
      const checkInRequest: CheckInRequest = {
        sessionId: validatedQR.sessionId,
        studentId,
        qrCodeData: decodedText,
        location: currentLocation,
        photo: capturedPhoto || undefined,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };

      // Process check-in
      await onCheckIn(checkInRequest);
      
      setSuccess(true);
      stopScanning();
    } catch (error) {
      console.error('Check-in error:', error);
      setError(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePhotoCheckIn = async () => {
    if (!capturedPhoto) {
      setError('Please capture a photo first');
      return;
    }

    try {
      setError('');
      setIsVerifying(true);

      // Get current location
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);

      // Create check-in request for photo verification
      const checkInRequest: CheckInRequest = {
        sessionId: 'photo-verification-' + Date.now(), // Temporary session ID for photo check-in
        studentId,
        photo: capturedPhoto,
        location: currentLocation,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };

      // Process check-in
      await onCheckIn(checkInRequest);
      
      setSuccess(true);
    } catch (error) {
      console.error('Photo check-in error:', error);
      setError(error instanceof Error ? error.message : 'Photo check-in failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetScanner = () => {
    setQrData(null);
    setLocation(null);
    setError('');
    setSuccess(false);
    setIsVerifying(false);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      await startScanning();
    } catch (error) {
      setCameraPermission('denied');
      setError('Camera permission denied. Please enable camera access.');
    }
  };

  const requestLocationPermission = async () => {
    try {
      await locationService.getCurrentLocation();
      setLocationPermission('granted');
    } catch (error) {
      setLocationPermission('denied');
      setError('Location permission denied. Please enable location access.');
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-600">Check-in Successful!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your attendance has been recorded for this session.
          </p>
          {qrData && (
            <div className="text-sm text-gray-500">
              <p>Session: {qrData.sessionId}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
            </div>
          )}
          <button
            onClick={resetScanner}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR Code Check-in
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Permission Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-3 rounded-lg border ${
            cameraPermission === 'granted' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : cameraPermission === 'denied'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">
                Camera: {cameraPermission === 'granted' ? 'Allowed' : cameraPermission === 'denied' ? 'Blocked' : 'Needed'}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            locationPermission === 'granted' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : locationPermission === 'denied'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                Location: {locationPermission === 'granted' ? 'Allowed' : locationPermission === 'denied' ? 'Blocked' : 'Needed'}
              </span>
            </div>
          </div>
        </div>

        {/* Scanner or Permission Request */}
        {!isScanning && cameraPermission !== 'granted' && (
          <div className="text-center space-y-4">
            <Camera className="w-16 h-16 text-gray-400 mx-auto" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Camera Permission Required
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              We need camera access to scan QR codes for attendance check-in.
            </p>
            <button
              onClick={requestCameraPermission}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Grant Camera Access
            </button>
          </div>
        )}

        {cameraPermission === 'granted' && !isScanning && (
          <div className="text-center space-y-4">
            <QrCode className="w-16 h-16 text-blue-600 mx-auto" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Ready to Scan
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Position the QR code within the frame to check in.
            </p>
            <button
              onClick={startScanning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Scanner
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : `border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <QrCode className="w-4 h-4" />
                <span>QR Code Scan</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'photo'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : `border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Photo Check-in</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'qr' ? (
            <div className="space-y-4">
              <div id="qr-reader" ref={scanRegionRef} className="w-full" />
              
              <div className="flex justify-center">
                <button
                  onClick={stopScanning}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            </div>
          ) : (
            <PhotoVerification
              onPhotoCapture={setCapturedPhoto}
              isRequired={true}
            />
          )}
        </div>

        {/* Verification State */}
        {isVerifying && (
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Verifying Check-in...
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'qr' ? 'Validating QR code and location...' : 'Validating photo and location...'}
            </p>
          </div>
        )}

        {/* Photo Check-in Button */}
        {activeTab === 'photo' && capturedPhoto && !isVerifying && (
          <div className="mt-6">
            <button
              onClick={handlePhotoCheckIn}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Complete Check-in with Photo</span>
            </button>
          </div>
        )}

        {/* QR Code Data Display */}
        {qrData && !isVerifying && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-green-800 dark:text-green-200">
                QR Code Validated
              </h4>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>Session: {qrData.sessionId}</p>
              <p>Expires: {qrData.expiresAt.toLocaleTimeString()}</p>
              {location && (
                <p>Location: ±{location.accuracy}m accuracy</p>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Check-in Failed
              </h4>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Instructions:
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Grant camera and location permissions</li>
            <li>Position the QR code in the scanner frame</li>
            <li>Wait for verification to complete</li>
            <li>Ensure you're within the classroom location</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
