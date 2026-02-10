'use client';

import { useAppStore } from '@/lib/store';
import { Class, AttendanceSession, AttendanceRecord } from '@/types';
import { calculateAttendanceStats } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
};

export default function AttendanceCharts() {
  const { sessions, classes } = useAppStore();

  // Prepare data for overall attendance pie chart
  const allRecords = sessions?.flatMap(s => s.records) || [];
  const overallStats = calculateAttendanceStats(allRecords);
  
  const pieData = [
    { name: 'Present', value: overallStats.present, color: COLORS.present },
    { name: 'Absent', value: overallStats.absent, color: COLORS.absent },
    { name: 'Late', value: overallStats.late, color: COLORS.late },
  ];

  // Prepare data for class comparison bar chart
  const classComparisonData = classes.map(classItem => {
    const classSessions = sessions?.filter(s => s.classId === classItem.id) || [];
    const classRecords = classSessions.flatMap(s => s.records);
    const stats = calculateAttendanceStats(classRecords);
    
    return {
      name: classItem.name.length > 15 ? classItem.name.substring(0, 15) + '...' : classItem.name,
      present: stats.presentPercentage,
      absent: stats.absentPercentage,
      late: stats.latePercentage,
    };
  });

  // Prepare data for attendance trend line chart
  const trendData = (sessions || [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(session => {
      const stats = calculateAttendanceStats(session.records);
      return {
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        presentPercentage: stats.presentPercentage,
        totalStudents: stats.total,
      };
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overall Attendance Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Overall Attendance Distribution</h3>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class Comparison Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Class Attendance Comparison</h3>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill={COLORS.present} name="Present %" />
              <Bar dataKey="absent" fill={COLORS.absent} name="Absent %" />
              <Bar dataKey="late" fill={COLORS.late} name="Late %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Trend Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Attendance Trend Over Time</h3>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="presentPercentage" 
                stroke={COLORS.present} 
                strokeWidth={2}
                name="Present %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Present</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{overallStats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Absent</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{overallStats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Late</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{overallStats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{overallStats.presentPercentage}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
