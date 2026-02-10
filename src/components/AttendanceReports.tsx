'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Class, AttendanceSession, AttendanceRecord } from '@/types';
import { Calendar, Filter, Download, FileText, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { exportToCSV, exportToPDF, calculateAttendanceStats } from '@/lib/utils';

interface AttendanceReportsProps {
  searchTerm: string;
}

export default function AttendanceReports({ searchTerm }: AttendanceReportsProps) {
  const { sessions, classes } = useAppStore();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const classMatch = selectedClass === 'all' || session.classId === selectedClass;
      const dateMatch =
        (!selectedDateRange.start || session.date >= selectedDateRange.start) &&
        (!selectedDateRange.end || session.date <= selectedDateRange.end);
      return classMatch && dateMatch;
    });
  }, [sessions, selectedClass, selectedDateRange]);

  const getClassName = (classId: string) => {
    const classItem = classes.find((c) => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getStudentName = (classId: string, studentId: string) => {
    const classItem = classes.find((c) => c.id === classId);
    const student = classItem?.students.find((s) => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getStudentEmail = (classId: string, studentId: string) => {
    const classItem = classes.find((c) => c.id === classId);
    const student = classItem?.students.find((s) => s.id === studentId);
    return student ? student.email : 'Unknown Email';
  };

  const getStudentId = (classId: string, studentId: string) => {
    const classItem = classes.find((c) => c.id === classId);
    const student = classItem?.students.find((s) => s.id === studentId);
    return student ? student.studentId : 'Unknown ID';
  };

  const exportAttendanceData = (format: 'csv' | 'pdf') => {
    const studentSummary = getStudentAttendanceSummary();
    
    if (format === 'csv') {
      const csvData = studentSummary.map(student => ({
        'Student Name': student.name,
        'Student ID': student.studentId,
        'Total Sessions': student.total,
        'Present': student.present,
        'Late': student.late,
        'Absent': student.absent,
        'Attendance Rate': `${student.attendanceRate}%`,
      }));
      exportToCSV(csvData, 'attendance_report');
    } else {
      // For PDF export, we'd need to create a printable element
      alert('PDF export feature coming soon!');
    }
  };

  const exportClassReport = (classItem: Class) => {
    const classSessions = filteredSessions.filter((s) => s.classId === classItem.id);
    const reportData = classSessions.flatMap(session => 
      session.records.map(record => {
        const student = classItem.students.find(s => s.id === record.studentId);
        return {
          'Date': session.date,
          'Student Name': student?.name || 'Unknown',
          'Student ID': student?.studentId || 'Unknown',
          'Status': record.status,
          'Timestamp': record.timestamp,
        };
      })
    );
    exportToCSV(reportData, `${classItem.name.replace(/\s+/g, '_')}_detailed_report`);
  };

  const getStudentAttendanceSummary = () => {
    const summary: Record<string, { 
      name: string; 
      studentId: string;
      email: string;
      present: number; 
      absent: number; 
      late: number; 
      total: number;
      attendanceRate: number;
    }> = {};

    filteredSessions.forEach((session) => {
      session.records.forEach((record) => {
        const studentName = getStudentName(record.classId, record.studentId);
        const studentEmail = getStudentEmail(record.classId, record.studentId);
        const studentId = getStudentId(record.classId, record.studentId);
        
        if (!summary[record.studentId]) {
          summary[record.studentId] = {
            name: studentName,
            studentId,
            email: studentEmail,
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
            attendanceRate: 0,
          };
        }
        summary[record.studentId][record.status]++;
        summary[record.studentId].total++;
      });
    });

    // Calculate attendance rates
    Object.values(summary).forEach(student => {
      student.attendanceRate = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
    });

    return Object.values(summary);
  };

  const getClassAttendanceSummary = () => {
    return classes.map((classItem) => {
      const classSessions = filteredSessions.filter((s) => s.classId === classItem.id);
      const allRecords = classSessions.flatMap((s) => s.records);
      const stats = calculateAttendanceStats(allRecords);

      return {
        class: classItem,
        sessions: classSessions.length,
        totalRecords: allRecords.length,
        attendancePercentage: stats.presentPercentage,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredSessions.length} sessions found
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => exportAttendanceData('csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Classes</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={selectedDateRange.start}
                onChange={(e) =>
                  setSelectedDateRange({ ...selectedDateRange, start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={selectedDateRange.end}
                onChange={(e) =>
                  setSelectedDateRange({ ...selectedDateRange, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Class Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {getClassAttendanceSummary().map((summary) => (
                <div key={summary.class.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{summary.class.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {summary.sessions} sessions • {summary.totalRecords} total records
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        summary.attendancePercentage >= 80 ? 'text-green-600' :
                        summary.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {summary.attendancePercentage}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
                    </div>
                    <button
                      onClick={() => exportClassReport(summary.class)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Export class report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Sessions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredSessions.slice(0, 5).map((session) => {
                const stats = calculateAttendanceStats(session.records);
                return (
                  <div key={session.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getClassName(session.classId)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.date} • {session.startTime} - {session.endTime || 'Ongoing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.records.length} students
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {stats.presentPercentage}% present
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700" id="attendance-table">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Student Attendance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {getStudentAttendanceSummary().map((student) => (
                <tr key={student.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {student.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-green-600 dark:text-green-400 font-medium">{student.present}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{student.late}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-red-600 dark:text-red-400 font-medium">{student.absent}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.attendanceRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      student.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {student.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
