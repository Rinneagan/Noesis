'use client';

import { useState, useEffect } from 'react';
import { QRCodeData } from '@/types';
import { qrService } from '@/lib/qr-service';
import { QrCode, RefreshCw, Clock, Shield, X } from 'lucide-react';

interface QRCodeDisplayProps {
  sessionId: string;
  className?: string;
  onClose?: () => void;
}

export default function QRCodeDisplay({ sessionId, className = '', onClose }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [qrImage, setQrImage] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    generateQRCode();
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (qrCode && prev > 0) {
          return Math.max(0, Math.floor((qrCode.expiresAt.getTime() - Date.now()) / 1000));
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, qrCode]);

  const generateQRCode = async () => {
    try {
      const newQRCode = await qrService.generateSessionQR(sessionId, 30); // 30 minutes
      const qrImage = await qrService.generateQRImage(newQRCode);
      
      setQrCode(newQRCode);
      setQrImage(qrImage);
      setTimeRemaining(Math.floor((newQRCode.expiresAt.getTime() - Date.now()) / 1000));
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const rotateQRCode = async () => {
    setIsRotating(true);
    await generateQRCode();
    setIsRotating(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining > 600) return 'text-green-600'; // > 10 minutes
    if (timeRemaining > 300) return 'text-yellow-600'; // > 5 minutes
    return 'text-red-600'; // < 5 minutes
  };

  const getStatusBadge = (): { color: string; text: string } => {
    if (!qrCode) return { color: 'bg-gray-100 text-gray-800', text: 'Generating...' };
    if (timeRemaining === 0) return { color: 'bg-red-100 text-red-800', text: 'Expired' };
    if (timeRemaining < 300) return { color: 'bg-yellow-100 text-yellow-800', text: 'Expiring Soon' };
    return { color: 'bg-green-100 text-green-800', text: 'Active' };
  };

  const status = getStatusBadge();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance QR Code
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.text}
          </span>
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

      {/* QR Code Display */}
      <div className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code Image */}
          <div className="relative">
            <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-gray-200">
              {qrImage ? (
                <img 
                  src={qrImage} 
                  alt="Attendance QR Code" 
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Generating QR Code...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Security Badge */}
            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* Session Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Session ID: <span className="font-mono font-medium">{sessionId}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              QR Code ID: <span className="font-mono text-xs">{qrCode?.id}</span>
            </p>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${getTimeColor()}`} />
            <span className={`text-sm font-medium ${getTimeColor()}`}>
              {timeRemaining > 0 ? `Expires in ${formatTime(timeRemaining)}` : 'Expired'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={rotateQRCode}
              disabled={isRotating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
              <span>Rotate QR Code</span>
            </button>
            
            {timeRemaining < 300 && (
              <button
                onClick={generateQRCode}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Extend Time</span>
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg max-w-md">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to check in:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Open your camera app or QR scanner</li>
              <li>Scan this QR code</li>
              <li>Follow the prompts to verify your attendance</li>
              <li>Ensure you're within the classroom location</li>
            </ol>
          </div>

          {/* Security Info */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Secure QR code with location and time verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
