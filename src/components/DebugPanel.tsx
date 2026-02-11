'use client';

import { useState, useEffect } from 'react';
import { Camera, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { qrService } from '@/lib/qr-service';
import { cameraService } from '@/lib/camera-service';

export default function DebugPanel() {
  const [qrTest, setQrTest] = useState<string>('');
  const [cameraTest, setCameraTest] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testQRCode = async () => {
    setLoading(true);
    try {
      console.log('Testing QR code generation...');
      const qrData = await qrService.generateSessionQR('test-session-123', 5);
      console.log('QR Data generated:', qrData);
      
      const qrImage = await qrService.generateQRImage(qrData);
      console.log('QR Image generated:', qrImage ? 'Success' : 'Failed');
      
      setQrTest(qrImage);
    } catch (error) {
      console.error('QR Code test failed:', error);
      setQrTest('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };

  const testCamera = async () => {
    setLoading(true);
    try {
      console.log('Testing camera access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices) {
        throw new Error('Camera API not available');
      }
      
      // Test camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      console.log('Camera access granted');
      
      // Test camera service
      const video = document.createElement('video');
      await cameraService.initializeCamera(video);
      console.log('Camera service initialized');
      
      const photo = await cameraService.capturePhoto();
      console.log('Photo captured:', photo ? 'Success' : 'Failed');
      
      setCameraTest(photo ? 'Camera working' : 'Camera failed');
      
      // Cleanup
      cameraService.stopCamera();
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Camera test failed:', error);
      setCameraTest('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 max-w-sm z-50">
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Debug Panel</h3>
      
      <div className="space-y-3">
        {/* QR Code Test */}
        <div className="border dark:border-gray-600 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code Test
            </span>
            <button
              onClick={testQRCode}
              disabled={loading}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test
            </button>
          </div>
          {qrTest && (
            <div className="text-xs">
              {qrTest.startsWith('Error') ? (
                <span className="text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {qrTest}
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  QR Code Generated
                </span>
              )}
            </div>
          )}
        </div>

        {/* Camera Test */}
        <div className="border dark:border-gray-600 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              Camera Test
            </span>
            <button
              onClick={testCamera}
              disabled={loading}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test
            </button>
          </div>
          {cameraTest && (
            <div className="text-xs">
              {cameraTest.startsWith('Error') ? (
                <span className="text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {cameraTest}
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {cameraTest}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center text-xs text-gray-500 mt-2">
          Testing...
        </div>
      )}
    </div>
  );
}
