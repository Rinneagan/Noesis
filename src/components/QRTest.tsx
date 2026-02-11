'use client';

import { useState, useEffect } from 'react';
import { qrService } from '@/lib/qr-service';

export default function QRTest() {
  const [qrImage, setQrImage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testQR = async () => {
      try {
        console.log('Starting QR test...');
        
        // Generate QR code
        const qrData = await qrService.generateSessionQR('test-123', 30);
        console.log('QR Data generated:', qrData);
        
        // Generate QR image
        const image = await qrService.generateQRImage(qrData);
        console.log('QR Image generated:', image ? 'Success' : 'Failed');
        
        setQrImage(image);
      } catch (err) {
        console.error('QR Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testQR();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">QR Code Test</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {qrImage ? (
        <div className="text-center">
          <img 
            src={qrImage} 
            alt="Test QR Code" 
            className="w-64 h-64 mx-auto border-2 border-gray-300"
          />
          <p className="mt-2 text-green-600">QR Code Generated Successfully!</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-64 h-64 mx-auto border-2 border-gray-300 flex items-center justify-center">
            <p className="text-gray-500">Generating QR Code...</p>
          </div>
        </div>
      )}
    </div>
  );
}
