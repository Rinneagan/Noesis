'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Class, Student, AttendanceRecord } from '@/types';
import { CheckCircle, XCircle, Clock, Users, CheckSquare, XSquare, AlertCircle, Download, QrCode, Wifi } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';
import QRCodeDisplay from './QRCodeDisplay';
import { useStudentCheckIns, useWebSocket } from '@/hooks/use-websocket';

interface AttendanceTrackerProps {
  searchTerm: string;
}

export default function AttendanceTracker({ searchTerm }: AttendanceTrackerProps) {
  const { classes, createAttendanceSession, updateAttendanceRecord, saveAttendanceSession, sessions } = useAppStore();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // WebSocket hooks for real-time updates
  const { isConnected, sendSessionStart, sendStudentCheckIn } = useWebSocket();
  const realTimeCheckIns = useStudentCheckIns(currentSessionId || undefined);

  const filteredClasses = useMemo(() => {
    return classes.filter(classItem => 
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  // Handle real-time check-ins
  useEffect(() => {
    if (realTimeCheckIns.length > 0 && selectedClass) {
      const latestCheckIn = realTimeCheckIns[realTimeCheckIns.length - 1];
      
      // Update local attendance state
      setAttendance(prev => ({
        ...prev,
        [latestCheckIn.studentId]: 'present'
      }));
      
      // Update store
      if (currentSessionId) {
        updateAttendanceRecord(currentSessionId, latestCheckIn.studentId, 'present');
      }
    }
  }, [realTimeCheckIns, selectedClass, currentSessionId, updateAttendanceRecord]);

  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem);
    const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    classItem.students.forEach((student) => {
      initialAttendance[student.id] = 'absent';
    });
    setAttendance(initialAttendance);
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    if (currentSessionId) {
      updateAttendanceRecord(currentSessionId, studentId, status);
    }
  };

  const handleBulkAttendance = (status: 'present' | 'absent' | 'late') => {
    if (!selectedClass) return;
    
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    selectedClass.students.forEach((student) => {
      newAttendance[student.id] = status;
      if (currentSessionId) {
        updateAttendanceRecord(currentSessionId, student.id, status);
      }
    });
    setAttendance(newAttendance);
  };

  const startSession = async () => {
    if (!selectedClass) return;
    
    const sessionId = await createAttendanceSession({
      classId: selectedClass.id,
      date: sessionDate,
      startTime: new Date().toLocaleTimeString(),
      records: [],
      isActive: true
    });
    
    setCurrentSessionId(sessionId);
    setSessionStarted(true);
    
    // Send WebSocket notification for real-time updates
    if (isConnected) {
      sendSessionStart({
        sessionId,
        classId: selectedClass.id,
        className: selectedClass.name,
        startTime: new Date().toLocaleTimeString(),
        lecturerId: 'lecturer-1' // This should come from auth context
      });
    }
  };

  const saveAttendance = () => {
    if (currentSessionId) {
      saveAttendanceSession(currentSessionId);
      alert('Attendance saved successfully!');
      resetSession();
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setSelectedClass(null);
    setCurrentSessionId(null);
    setAttendance({});
    setShowQRCode(false);
  };

  const exportCurrentAttendance = () => {
    if (!selectedClass) return;
    
    const csvData = selectedClass.students.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Email': student.email,
      'Status': attendance[student.id] || 'absent',
    }));
    
    exportToCSV(csvData, `${selectedClass.name.replace(/\s+/g, '_')}_${sessionDate}_attendance`);
  };

  const getAttendanceStats = () => {
    if (!selectedClass) return { present: 0, absent: 0, late: 0 };

    return Object.values(attendance).reduce(
      (acc, status) => {
        acc[status]++;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Take Attendance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredClasses.length} of {classes.length} classes available
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Real-time connection indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Recent real-time check-ins */}
      {sessionStarted && realTimeCheckIns.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h4 className="font-medium text-green-800 dark:text-green-200">Recent Check-ins</h4>
            <span className="text-sm text-green-600 dark:text-green-400">
              ({realTimeCheckIns.length})
            </span>
          </div>
          <div className="space-y-2">
            {realTimeCheckIns.slice(-3).reverse().map((checkIn, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-200">
                    {checkIn.studentName}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <span className="text-xs">{checkIn.method}</span>
                  <span className="text-xs">{checkIn.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedClass ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              onClick={() => handleClassSelect(classItem)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {classItem.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{classItem.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {classItem.students.length} students
                  </span>
                </div>
                <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Select</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* QR Code Modal */}
          {showQRCode && currentSessionId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="max-w-2xl w-full">
                <QRCodeDisplay
                  sessionId={currentSessionId}
                  onClose={() => setShowQRCode(false)}
                />
              </div>
            </div>
          )}

          {/* Class Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedClass.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedClass.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {sessionStarted && (
                    <button
                      onClick={() => setShowQRCode(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Generate QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={exportCurrentAttendance}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Export Attendance"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={resetSession}
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
              </div>
            </div>

            <div className="p-6">
              {!sessionStarted ? (
                <div className="text-center py-8">
                  <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Start Attendance Session</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ready to take attendance for {selectedClass.students.length} students
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={startSession}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Start Session</span>
                    </button>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4 mr-2" />
                      QR codes will be available after starting
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Session Active</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {sessionDate} • Started at {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowQRCode(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Show QR Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleBulkAttendance('present')}
                        className="bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Mark All Present</span>
                      </button>
                      <button
                        onClick={() => handleBulkAttendance('late')}
                        className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 transition-colors flex items-center space-x-1"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Mark All Late</span>
                      </button>
                      <button
                        onClick={() => handleBulkAttendance('absent')}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                      >
                        <XSquare className="w-4 h-4" />
                        <span>Mark All Absent</span>
                      </button>
                    </div>
                    <button
                      onClick={saveAttendance}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Save Attendance</span>
                    </button>
                  </div>

                  {/* Student List */}
                  <div className="space-y-3">
                    {selectedClass.students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.email} • {student.studentId}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {(['present', 'late', 'absent'] as const).map((status) => {
                            const isActive = attendance[student.id] === status;
                            const iconMap = {
                              present: CheckCircle,
                              late: Clock,
                              absent: XCircle,
                            };
                            const Icon = iconMap[status];
                            const colorMap = {
                              present: isActive
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                              late: isActive
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                              absent: isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                            };
                            
                            return (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student.id, status)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${colorMap[status]}`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
