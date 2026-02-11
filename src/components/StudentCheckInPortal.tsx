'use client';

import { useState } from 'react';
import { CheckInRequest } from '@/types';
import { useAppStore } from '@/lib/store';
import QRScanner from './QRScanner';
import { Camera, MapPin, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';

interface StudentCheckInPortalProps {
  studentId: string;
}

export default function StudentCheckInPortal({ studentId }: StudentCheckInPortalProps) {
  const { classes, sessions } = useAppStore();
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  
  // WebSocket for real-time notifications
  const { isConnected, sendStudentCheckIn } = useWebSocket();

  const handleCheckIn = async (request: CheckInRequest) => {
    try {
      setCheckInStatus('processing');
      setStatusMessage('Processing check-in...');

      // Simulate API call - in real app, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Validate the check-in request
      const session = sessions.find(s => s.id === request.sessionId);
      if (!session) {
        throw new Error('Invalid session');
      }

      // Check if student is already checked in
      const existingRecord = session.records.find(r => r.studentId === studentId);
      if (existingRecord) {
        throw new Error('Already checked in to this session');
      }

      // Add the attendance record
      const newRecord = {
        id: `${request.sessionId}-${studentId}`,
        classId: session.classId,
        studentId,
        date: session.date,
        status: 'present' as const,
        timestamp: new Date().toLocaleTimeString(),
        checkInMethod: request.qrCodeData ? 'qr' as const : 'manual' as const,
        location: request.location,
        deviceInfo: request.deviceInfo
      };

      // Update session with new record
      session.records.push(newRecord);

      // Send WebSocket notification for real-time updates
      if (isConnected) {
        const student = classes.find(c => c.students.find(s => s.id === studentId))?.students.find(s => s.id === studentId);
        sendStudentCheckIn({
          sessionId: request.sessionId,
          studentId,
          studentName: student?.name || `Student ${studentId}`,
          timestamp: new Date().toLocaleTimeString(),
          method: request.qrCodeData ? 'qr' : 'manual',
          location: request.location ? {
            latitude: request.location.latitude,
            longitude: request.location.longitude,
            accuracy: request.location.accuracy
          } : undefined
        });
      }

      setCheckInStatus('success');
      setStatusMessage('Check-in successful!');
      
      // Add to recent check-ins
      setRecentCheckIns(prev => [{
        sessionId: request.sessionId,
        className: classes.find(c => c.id === session.classId)?.name || 'Unknown Class',
        timestamp: new Date(),
        method: request.qrCodeData ? 'QR Code' : 'Manual'
      }, ...prev.slice(0, 4)]);

    } catch (error) {
      setCheckInStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Check-in failed');
    }
  };

  const getTodaysSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(session => 
      session.date === today && session.isActive
    );
  };

  const todaysSessions = getTodaysSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Student Check-in Portal
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Student ID: {studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Active Sessions */}
      {todaysSessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Today's Active Sessions
          </h3>
          <div className="space-y-3">
            {todaysSessions.map(session => {
              const classInfo = classes.find(c => c.id === session.classId);
              return (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {classInfo?.name || 'Unknown Class'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.date} • {session.startTime}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Check-in Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>QR Code Scan</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Manual Check-in</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'qr' ? (
            <QRScanner
              onCheckIn={handleCheckIn}
              studentId={studentId}
            />
          ) : (
            <ManualCheckIn
              onCheckIn={handleCheckIn}
              studentId={studentId}
              sessions={todaysSessions}
            />
          )}
        </div>
      </div>

      {/* Status Display */}
      {checkInStatus !== 'idle' && (
        <div className={`rounded-lg p-4 ${
          checkInStatus === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : checkInStatus === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
          <div className="flex items-center space-x-3">
            {checkInStatus === 'success' && (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
                {checkInStatus === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                {checkInStatus === 'processing' && (
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
            <div>
              <h4 className={`font-medium ${
                checkInStatus === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : checkInStatus === 'error'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {checkInStatus === 'success' ? 'Success!' : 
                 checkInStatus === 'error' ? 'Error' : 'Processing...'}
              </h4>
              <p className={`text-sm ${
                checkInStatus === 'success' 
                  ? 'text-green-700 dark:text-green-300' 
                  : checkInStatus === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {statusMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Check-ins
          </h3>
          <div className="space-y-3">
            {recentCheckIns.map((checkIn, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {checkIn.className}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {checkIn.timestamp.toLocaleString()} • {checkIn.method}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Manual Check-in Component
function ManualCheckIn({ 
  onCheckIn, 
  studentId, 
  sessions 
}: { 
  onCheckIn: (request: CheckInRequest) => Promise<void>;
  studentId: string;
  sessions: any[];
}) {
  const [selectedSession, setSelectedSession] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleManualCheckIn = async () => {
    if (!selectedSession) {
      alert('Please select a session');
      return;
    }

    try {
      setIsGettingLocation(true);
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      setIsGettingLocation(false);

      const checkInRequest: CheckInRequest = {
        sessionId: selectedSession,
        studentId,
        location: currentLocation,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };

      await onCheckIn(checkInRequest);
    } catch (error) {
      setIsGettingLocation(false);
      console.error('Manual check-in error:', error);
    }
  };

  const getCurrentLocation = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => {
          reject(new Error('Location access denied'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Session
        </label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Choose a session...</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.startTime} - {session.date}
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Getting your location for verification...
              </span>
            </div>
          </div>

          {location && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Location verified: ±{location.accuracy}m accuracy
              </p>
            </div>
          )}

          <button
            onClick={handleManualCheckIn}
            disabled={isGettingLocation}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isGettingLocation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Check In Manually</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
