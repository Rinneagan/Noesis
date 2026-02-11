'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, CheckCircle, User } from 'lucide-react';
import { cameraService } from '@/lib/camera-service';

interface PhotoVerificationProps {
  onPhotoCapture: (photoData: string) => void;
  isRequired?: boolean;
  className?: string;
}

export default function PhotoVerification({ 
  onPhotoCapture, 
  isRequired = false, 
  className = '' 
}: PhotoVerificationProps) {
  const [photo, setPhoto] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [photoQuality, setPhotoQuality] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      cameraService.stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      setIsCapturing(true);
      setCameraError('');
      
      await cameraService.initializeCamera(videoRef.current);
    } catch (error) {
      console.error('Camera initialization error:', error);
      setCameraError(error instanceof Error ? error.message : 'Failed to access camera');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    cameraService.stopCamera();
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      
      // Capture photo from video stream
      const photoData = await cameraService.capturePhoto();
      setPhoto(photoData);

      // Validate photo quality
      const quality = await cameraService.validatePhotoQuality(photoData);
      setPhotoQuality(quality);

      if (quality.isValid) {
        onPhotoCapture(photoData);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Photo capture error:', error);
      setCameraError(error instanceof Error ? error.message : 'Failed to capture photo');
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setPhoto('');
    setPhotoQuality(null);
    setCameraError('');
  };

  const getQualityColor = (quality: any) => {
    if (!quality) return 'text-gray-500';
    if (quality.issues.length === 0) return 'text-green-600';
    if (quality.issues.length <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBg = (quality: any) => {
    if (!quality) return 'bg-gray-100';
    if (quality.issues.length === 0) return 'bg-green-100';
    if (quality.issues.length <= 2) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Photo Verification
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {photo && (
            <button
              onClick={retakePhoto}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Retake photo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {!photo ? (
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isCapturing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <CameraOff className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm opacity-75">Camera not active</p>
                </div>
              )}

              {/* Camera Error Overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center">
                  <div className="text-center text-white p-4">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-4 py-2 bg-white text-red-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Capturing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center space-x-4">
              {!isCapturing ? (
                <button
                  onClick={startCamera}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={capturePhoto}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>Stop Camera</span>
                  </button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Photo Guidelines:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Position your face clearly in the frame</li>
                <li>Ensure good lighting (avoid backlighting)</li>
                <li>Remove sunglasses and masks</li>
                <li>Hold camera steady and look directly at it</li>
                <li>Photo will be automatically validated for quality</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Photo Preview */
          <div className="space-y-4">
            <div className="relative">
              <img
                src={photo}
                alt="Captured photo"
                className="w-full rounded-lg"
              />
              
              {/* Quality Indicator */}
              {photoQuality && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getQualityBg(photoQuality)} ${getQualityColor(photoQuality)}`}>
                  {photoQuality.issues.length === 0 ? 'Good Quality' : 'Needs Improvement'}
                </div>
              )}
            </div>

            {/* Quality Assessment */}
            {photoQuality && (
              <div className={`p-4 rounded-lg ${getQualityBg(photoQuality)}`}>
                <h4 className={`font-medium mb-2 ${getQualityColor(photoQuality)}`}>
                  Photo Quality Assessment
                </h4>
                
                {photoQuality.issues.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Issues found:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {photoQuality.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                    {photoQuality.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Suggestions:</p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {photoQuality.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Photo quality is acceptable</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={retakePhoto}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
              
              {photoQuality?.isValid && (
                <button
                  onClick={() => onPhotoCapture(photo)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
