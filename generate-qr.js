const QRCode = require('qrcode');
const fs = require('fs');

async function generateAttendanceQR() {
  console.log('🎯 Generating Attendance QR Code...\n');
  
  try {
    // Create realistic attendance session data
    const sessionId = 'ATTEND-SESSION-' + Date.now();
    const qrData = {
      sessionId: sessionId,
      qrId: 'QR_' + Date.now(),
      timestamp: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes from now
      type: 'attendance-checkin',
      className: 'Computer Science 101',
      lecturerId: 'prof-123',
      room: 'Room 301',
      startTime: new Date().toLocaleTimeString()
    };
    
    const qrString = JSON.stringify(qrData);
    
    console.log('📱 QR Code Data:');
    console.log(JSON.stringify(qrData, null, 2));
    console.log('');
    
    // Generate QR code as PNG
    console.log('🔄 Generating QR Code image...');
    
    const qrBuffer = await QRCode.toBuffer(qrString, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    // Save QR code as PNG file
    const filename = 'attendance-qr-code.png';
    fs.writeFileSync(filename, qrBuffer);
    
    console.log('✅ QR Code Generated Successfully!');
    console.log('💾 Saved as:', filename);
    console.log('📏 File size:', qrBuffer.length, 'bytes');
    console.log('');
    console.log('🔍 Session Information:');
    console.log('   Session ID:', sessionId);
    console.log('   Class:', qrData.className);
    console.log('   Room:', qrData.room);
    console.log('   Start Time:', qrData.startTime);
    console.log('   Expires At:', new Date(qrData.expiresAt).toLocaleString());
    console.log('');
    console.log('📱 To Test:');
    console.log('   1. Open the attendance web app');
    console.log('   2. Go to Student Check-in portal');
    console.log('   3. Scan this QR code with your phone');
    console.log('');
    console.log('🌐 Web App: http://localhost:3000 (when running)');
    console.log('📄 Demo HTML: open qr-demo.html in browser');
    
    return {
      success: true,
      filename,
      sessionId,
      qrData
    };
    
  } catch (error) {
    console.error('❌ QR Generation Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the QR code generation
generateAttendanceQR();
