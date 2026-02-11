'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { AttendanceRecord, Class, AttendanceSession } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Users, Clock, 
  Filter, Download, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  className?: string;
}

export default function AdvancedAnalytics({ className = '' }: AdvancedAnalyticsProps) {
  const { classes, sessions } = useAppStore();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'semester' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [chartType, setChartType] = useState<'overview' | 'trends' | 'comparison' | 'patterns'>('overview');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      
      // Date range filtering
      if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sessionDate >= monthAgo;
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        return sessionDate >= start && sessionDate <= end;
      }
      return true;
    });

    // Class filtering
    const classFiltered = selectedClass === 'all' 
      ? filteredSessions 
      : filteredSessions.filter((session: AttendanceSession) => session.classId === selectedClass);

    // Calculate metrics
    const totalSessions = classFiltered.length;
    const totalRecords = classFiltered.reduce((sum, session) => sum + session.records.length, 0);
    const presentRecords = classFiltered.reduce((sum, session) => 
      sum + session.records.filter((r: AttendanceRecord) => r.status === 'present').length, 0);
    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    // Daily attendance data
    const dailyData = classFiltered.reduce((acc: Record<string, any>, session: AttendanceSession) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      acc[date].total += session.records.length;
      acc[date].present += session.records.filter((r: AttendanceRecord) => r.status === 'present').length;
      acc[date].absent += session.records.filter((r: AttendanceRecord) => r.status === 'absent').length;
      acc[date].late += session.records.filter((r: AttendanceRecord) => r.status === 'late').length;
      return acc;
    }, {} as Record<string, any>);

    // Class performance data
    const classPerformance = classes.map(cls => {
      const classSessions = classFiltered.filter(s => s.classId === cls.id);
      const classRecords = classSessions.reduce((sum, s) => sum + s.records.length, 0);
      const classPresent = classSessions.reduce((sum, s) => 
        sum + s.records.filter(r => r.status === 'present').length, 0);
      const classRate = classRecords > 0 ? (classPresent / classRecords) * 100 : 0;

      return {
        name: cls.name,
        total: classRecords,
        present: classPresent,
        rate: classRate.toFixed(1)
      };
    });

    // Time-based patterns
    const timePatterns = classSessions.reduce((acc: Record<number, number>, session: AttendanceSession) => {
      session.records.forEach((record: AttendanceRecord) => {
        const hour = parseInt(record.timestamp.split(':')[0]);
        if (!acc[hour]) acc[hour] = 0;
        acc[hour]++;
      });
      return acc;
    }, {} as Record<number, number>);

    return {
      totalSessions,
      totalRecords,
      presentRecords,
      attendanceRate,
      dailyData: Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data,
        rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0'
      })),
      classPerformance,
      timePatterns: Object.entries(timePatterns).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        time: `${hour}:00`
      }))
    };
  }, [sessions, dateRange, customStartDate, customEndDate, selectedClass]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Advanced Analytics
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const data = analyticsData;
                const csv = [
                  ['Date', 'Total Students', 'Present', 'Absent', 'Late', 'Attendance Rate'],
                  ...data.dailyData.map(d => [
                    d.date,
                    d.total,
                    d.present,
                    d.absent,
                    d.late,
                    d.rate + '%'
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'advanced-analytics.csv';
                a.click();
              }}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="semester">Semester</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </>
          )}

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Class Filter
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="overview">Overview</option>
              <option value="trends">Trends</option>
              <option value="comparison">Class Comparison</option>
              <option value="patterns">Time Patterns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {analyticsData.totalSessions}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Records</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {analyticsData.totalRecords}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Present Records</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {analyticsData.presentRecords}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                  {analyticsData.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <PieChartIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Charts */}
        {chartType === 'overview' && (
          <div className="space-y-8">
            {/* Attendance Trend */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                📈 Attendance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                📊 Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: analyticsData.presentRecords, color: '#10b981' },
                      { name: 'Absent', value: analyticsData.totalRecords - analyticsData.presentRecords, color: '#ef4444' },
                      { name: 'Late', value: analyticsData.dailyData.reduce((sum, d) => sum + d.late, 0), color: '#f59e0b' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries({
                      'Present': '#10b981',
                      'Absent': '#ef4444', 
                      'Late': '#f59e0b'
                    }).map(([name, color]) => (
                      <Cell key={`cell-${name}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'comparison' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              📊 Class Performance Comparison
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.classPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total Records" />
                <Bar dataKey="present" fill="#10b981" name="Present" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'patterns' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              ⏰ Check-in Time Patterns
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.timePatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
