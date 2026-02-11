const QRCode = require('qrcode');

async function generateTestQR() {
  try {
    console.log('🔄 Generating QR Code...');
    
    // Create test QR data
    const qrData = {
      sessionId: 'test-session-' + Date.now(),
      qrId: 'qr_' + Date.now(),
      timestamp: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      type: 'attendance-checkin'
    };
    
    const qrString = JSON.stringify(qrData);
    console.log('📱 QR Data:', qrString);
    
    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log('✅ QR Code Generated Successfully!');
    console.log('📏 Size:', qrImage.length, 'characters');
    console.log('🔍 Data URL starts with:', qrImage.substring(0, 50) + '...');
    
    // Save QR code to file
    const fs = require('fs');
    const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('test-qr-code.png', base64Data, 'base64');
    
    console.log('💾 QR Code saved as: test-qr-code.png');
    console.log('🌐 Open http://localhost:3000 to see QR code in the app');
    
    return qrImage;
  } catch (error) {
    console.error('❌ QR Generation Failed:', error.message);
    throw error;
  }
}

generateTestQR();
