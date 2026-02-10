'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, BookOpen, User, Users } from 'lucide-react';
import { calculateAttendanceStats } from '@/lib/utils';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { classes, sessions } = useAppStore();
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Get classes the student is enrolled in
  const enrolledClasses = useMemo(() => {
    if (!user || !user.enrolledClasses) return [];
    return classes.filter(cls => user.enrolledClasses?.includes(cls.id));
  }, [classes, user?.enrolledClasses]);

  // Get attendance records for this student
  const studentSessions = useMemo(() => {
    if (!user || !user.studentId) return [];
    return sessions.filter(session => 
      session.records.some(record => record.studentId === user.studentId)
    );
  }, [sessions, user?.studentId]);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!user || !user.studentId) return { total: 0, present: 0, absent: 0, late: 0, presentPercentage: 0 };
    const allRecords = studentSessions.flatMap(session => 
      session.records.filter(record => record.studentId === user.studentId)
    );
    return calculateAttendanceStats(allRecords);
  }, [studentSessions, user?.studentId]);

  // Get recent attendance
  const recentAttendance = useMemo(() => {
    if (!user || !user.studentId) return [];
    return studentSessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(session => {
        const record = session.records.find(r => r.studentId === user.studentId);
        const classInfo = classes.find(c => c.id === session.classId);
        return {
          className: classInfo?.name || 'Unknown Class',
          date: session.date,
          status: record?.status || 'absent',
          time: record?.timestamp || '',
        };
      });
  }, [studentSessions, classes, user?.studentId]);

  // Filter sessions by selected class
  const filteredSessions = useMemo(() => {
    if (selectedClass === 'all') return recentAttendance;
    return recentAttendance.filter(session => {
      const classInfo = classes.find(c => c.id === selectedClass);
      return session.className === classInfo?.name;
    });
  }, [selectedClass, recentAttendance, classes]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100">Student ID: {user?.studentId}</p>
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.total}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Present</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceStats.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats.presentPercentage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Attendance</h3>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Classes</option>
            {enrolledClasses.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recent Attendance List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSessions.map((session, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {session.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {session.time || '--:--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'present'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : session.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSessions.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">My Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledClasses.map((cls) => (
            <div key={cls.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white">{cls.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cls.description}</p>
              <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4 mr-1" />
                {cls.students.length} students enrolled
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
