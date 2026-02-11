import QRCode from 'qrcode';
import { QRCodeData, AttendanceSession } from '@/types';

export class QRService {
  private static instance: QRService;
  private activeQRCodes: Map<string, QRCodeData> = new Map();

  static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  /**
   * Generate a dynamic QR code for an attendance session
   */
  async generateSessionQR(sessionId: string, expiresInMinutes: number = 30): Promise<QRCodeData> {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const qrId = `qr_${sessionId}_${Date.now()}`;
    
    const qrData: QRCodeData = {
      id: qrId,
      sessionId,
      data: JSON.stringify({
        sessionId,
        qrId,
        timestamp: Date.now(),
        expiresAt: expiresAt.getTime(),
        type: 'attendance-checkin'
      }),
      expiresAt,
      createdAt: new Date(),
      isActive: true
    };

    // Store the QR code data
    this.activeQRCodes.set(qrId, qrData);

    // Clean up expired QR codes
    this.cleanupExpiredQRCodes();

    return qrData;
  }

  /**
   * Generate QR code image as data URL
   */
  async generateQRImage(qrData: QRCodeData): Promise<string> {
    try {
      console.log('Generating QR image for data:', qrData.data);
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData.data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      console.log('QR image generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('Failed to generate QR code image:', error);
      throw new Error('Failed to generate QR code: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Validate QR code data
   */
  validateQRCode(qrCodeData: string): QRCodeData | null {
    try {
      const parsed = JSON.parse(qrCodeData);
      
      if (parsed.type !== 'attendance-checkin') {
        return null;
      }

      const qrId = parsed.qrId;
      const storedQR = this.activeQRCodes.get(qrId);
      
      if (!storedQR) {
        return null;
      }

      // Check if QR code has expired
      if (new Date() > storedQR.expiresAt) {
        this.activeQRCodes.delete(qrId);
        return null;
      }

      // Verify the data matches
      if (storedQR.data === qrCodeData) {
        return storedQR;
      }

      return null;
    } catch (error) {
      console.error('Failed to validate QR code:', error);
      return null;
    }
  }

  /**
   * Deactivate a QR code
   */
  deactivateQRCode(qrId: string): boolean {
    const qrCode = this.activeQRCodes.get(qrId);
    if (qrCode) {
      qrCode.isActive = false;
      this.activeQRCodes.delete(qrId);
      return true;
    }
    return false;
  }

  /**
   * Get active QR code for a session
   */
  getActiveQRCode(sessionId: string): QRCodeData | null {
    for (const [qrId, qrData] of this.activeQRCodes.entries()) {
      if (qrData.sessionId === sessionId && qrData.isActive) {
        // Check if expired
        if (new Date() > qrData.expiresAt) {
          this.activeQRCodes.delete(qrId);
          continue;
        }
        return qrData;
      }
    }
    return null;
  }

  /**
   * Clean up expired QR codes
   */
  private cleanupExpiredQRCodes(): void {
    const now = new Date();
    for (const [qrId, qrData] of this.activeQRCodes.entries()) {
      if (now > qrData.expiresAt) {
        this.activeQRCodes.delete(qrId);
      }
    }
  }

  /**
   * Generate multiple QR codes for a session (for rotating QR codes)
   */
  async generateRotatingQRCodes(sessionId: string, count: number = 3, expiresInMinutes: number = 10): Promise<QRCodeData[]> {
    const qrCodes: QRCodeData[] = [];
    
    for (let i = 0; i < count; i++) {
      const qrCode = await this.generateSessionQR(sessionId, expiresInMinutes);
      qrCodes.push(qrCode);
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return qrCodes;
  }

  /**
   * Get QR code statistics
   */
  getQRStats(): {
    totalActive: number;
    expiredToday: number;
    activeSessions: string[];
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let expiredToday = 0;
    const activeSessions = new Set<string>();

    for (const [qrId, qrData] of this.activeQRCodes.entries()) {
      activeSessions.add(qrData.sessionId);
      
      if (qrData.expiresAt < today) {
        expiredToday++;
      }
    }

    return {
      totalActive: this.activeQRCodes.size,
      expiredToday,
      activeSessions: Array.from(activeSessions)
    };
  }
}

export const qrService = QRService.getInstance();
