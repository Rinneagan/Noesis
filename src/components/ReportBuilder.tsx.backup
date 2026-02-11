'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { AttendanceRecord, Class, AttendanceSession } from '@/types';
import { 
  FileText, Download, Calendar, Users, Filter, Settings, 
  ChevronDown, Plus, Trash2, Eye
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  filters: string[];
}

interface ReportBuilderProps {
  className?: string;
}

export default function ReportBuilder({ className = '' }: ReportBuilderProps) {
  const { classes, sessions } = useAppStore();
  const [reportType, setReportType] = useState<'attendance' | 'performance' | 'summary' | 'custom'>('attendance');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'semester' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'daily-attendance',
      name: 'Daily Attendance Report',
      description: 'Detailed daily attendance records with status and timestamps',
      fields: ['date', 'studentName', 'status', 'checkInTime', 'checkInMethod'],
      filters: ['dateRange', 'classes']
    },
    {
      id: 'weekly-summary',
      name: 'Weekly Summary',
      description: 'Weekly attendance summary with statistics and trends',
      fields: ['week', 'totalStudents', 'attendanceRate', 'topPerformers', 'areasOfConcern'],
      filters: ['dateRange', 'classes']
    },
    {
      id: 'class-performance',
      name: 'Class Performance Analysis',
      description: 'Comprehensive class performance metrics and comparisons',
      fields: ['className', 'totalSessions', 'averageAttendance', 'trend', 'recommendations'],
      filters: ['dateRange', 'classes']
    },
    {
      id: 'student-records',
      name: 'Individual Student Records',
      description: 'Complete attendance history for specific students',
      fields: ['studentName', 'studentId', 'attendanceHistory', 'statistics', 'trends'],
      filters: ['dateRange', 'classes', 'students']
    },
    {
      id: 'absence-report',
      name: 'Absence Analysis',
      description: 'Detailed analysis of student absences and patterns',
      fields: ['studentName', 'absenceDates', 'totalAbsences', 'absenceRate', 'patterns'],
      filters: ['dateRange', 'classes']
    }
  ];

  // Generate report data based on template and filters
  const reportData = useMemo(() => {
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
    const classFiltered = selectedClasses.length === 0 
      ? filteredSessions 
      : filteredSessions.filter(session => selectedClasses.includes(session.classId));

    // Generate data based on report type
    switch (reportType) {
      case 'attendance':
        return classFiltered.flatMap(session => 
          session.records.map(record => ({
            date: session.date,
            className: classes.find(c => c.id === session.classId)?.name || 'Unknown',
            studentName: `Student ${record.studentId}`,
            status: record.status,
            checkInTime: record.timestamp,
            checkInMethod: record.checkInMethod || 'manual'
          }))
        );
      
      case 'performance':
        return classes.map(cls => {
          const classSessions = classFiltered.filter(s => s.classId === cls.id);
          const totalRecords = classSessions.reduce((sum, s) => sum + s.records.length, 0);
          const presentRecords = classSessions.reduce((sum, s) => 
            sum + s.records.filter(r => r.status === 'present').length, 0);
          const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
          
          return {
            className: cls.name,
            totalSessions: classSessions.length,
            totalRecords,
            presentRecords,
            attendanceRate: attendanceRate.toFixed(1) + '%',
            trend: attendanceRate >= 80 ? '📈 Excellent' : attendanceRate >= 70 ? '📊 Good' : '📉 Needs Improvement'
          };
        });
      
      default:
        return [];
    }
  }, [sessions, reportType, dateRange, customStartDate, customEndDate, selectedClasses, classes]);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      switch (format) {
        case 'csv':
          generateCSVReport();
          break;
        case 'excel':
          generateExcelReport();
          break;
        case 'pdf':
          generatePDFReport();
          break;
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCSVReport = () => {
    const headers = Object.keys(reportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    
    downloadFile(csvContent, `attendance-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const generateExcelReport = () => {
    // For now, generate CSV (Excel would require additional library)
    generateCSVReport();
  };

  const generatePDFReport = () => {
    // For now, generate CSV (PDF would require additional library)
    generateCSVReport();
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📄 Custom Report Builder
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="attendance">Attendance Records</option>
              <option value="performance">Performance Analysis</option>
              <option value="summary">Summary Report</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>

          {/* Report Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Settings className="w-4 h-4 inline mr-1" />
              Report Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select a template...</option>
              {reportTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {reportTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              </div>
            )}
          </div>

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

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Download className="w-4 h-4 inline mr-1" />
              Export Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}

        {/* Class Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Class Filter
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600">
            {classes.map(cls => (
              <label key={cls.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(cls.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClasses([...selectedClasses, cls.id]);
                    } else {
                      setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{cls.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Include Charts */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Charts in Report
            </span>
          </label>
        </div>
      </div>

      {/* Preview */}
      {reportData.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            👁 Report Preview ({reportData.length} records)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {Object.keys(reportData[0]).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.length > 10 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
              Showing first 10 of {reportData.length} records. Generate full report to see all data.
            </p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
