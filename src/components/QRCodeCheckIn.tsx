'use client';

import { useState, useEffect } from 'react';
import { generateQRCode } from '@/lib/utils';
import { Class, Student } from '@/types';
import { QrCode, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface QRCodeCheckInProps {
  classItem: Class;
  sessionId: string;
  onClose: () => void;
}

export default function QRCodeCheckIn({ classItem, sessionId, onClose }: QRCodeCheckInProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [checkedInStudents, setCheckedInStudents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const checkInData = {
          sessionId,
          classId: classItem.id,
          className: classItem.name,
          timestamp: new Date().toISOString(),
        };
        
        const qrData = JSON.stringify(checkInData);
        const url = await generateQRCode(qrData);
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [classItem, sessionId]);

  const simulateStudentCheckIn = (studentId: string) => {
    setCheckedInStudents(prev => new Set(prev).add(studentId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                QR Code Check-in - {classItem.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Session ID: {sessionId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Section */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 w-full max-w-sm">
                <div className="flex flex-col items-center space-y-4">
                  <QrCode className="w-12 h-12 text-blue-600" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Scan to Check In
                  </h4>
                  
                  {isLoading ? (
                    <div className="w-64 h-64 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code for check-in" 
                      className="w-64 h-64 rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">Failed to generate QR code</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Students can scan this QR code with their mobile devices to check in to this class session.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Check-in Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Live Check-in Status
                </h4>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {checkedInStudents.size} / {classItem.students.length} checked in
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {classItem.students.map((student) => {
                    const isCheckedIn = checkedInStudents.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCheckedIn
                            ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700'
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCheckedIn
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-400'
                          }`}>
                            {isCheckedIn ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {student.studentId}
                            </p>
                          </div>
                        </div>
                        
                        {!isCheckedIn && (
                          <button
                            onClick={() => simulateStudentCheckIn(student.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Simulate Check-in
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Check-in Progress
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round((checkedInStudents.size / classItem.students.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(checkedInStudents.size / classItem.students.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
