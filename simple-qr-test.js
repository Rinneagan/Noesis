console.log('🎯 Starting QR Code Generation Test...');

try {
  const QRCode = require('qrcode');
  console.log('✅ qrcode package loaded');
  
  const testData = 'Hello World - ' + new Date().toISOString();
  console.log('📱 Test data:', testData);
  
  // Generate QR code as terminal output
  QRCode.toString(testData, { type: 'terminal', small: true }, function (err, qr) {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log('✅ QR Code Generated:');
      console.log(qr);
      console.log('\n🎉 SUCCESS! QR Code generation is working!');
    }
  });
  
} catch (error) {
  console.error('❌ Failed to load qrcode package:', error.message);
  console.log('💡 Try running: npm install qrcode');
}
