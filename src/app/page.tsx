'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import ClassList from '@/components/ClassList';
import AttendanceTracker from '@/components/AttendanceTracker';
import AttendanceReports from '@/components/AttendanceReports';
import AttendanceCharts from '@/components/AttendanceCharts';
import Login from '@/components/Login';
import StudentDashboard from '@/components/StudentDashboard';
import StudentCheckInPortal from '@/components/StudentCheckInPortal';
import StudentSelfServicePortal from '@/components/StudentSelfServicePortal';
import NotificationCenter from '@/components/NotificationCenter';
import DebugPanel from '@/components/DebugPanel';
import QRTest from '@/components/QRTest';
import { Search, Moon, Sun, Download, Upload, Settings, LogOut, User } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { classes, sessions, darkMode, toggleDarkMode, exportData, initializeData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'classes' | 'attendance' | 'reports' | 'charts' | 'dashboard' | 'checkin' | 'selfservice'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeData();
    }
  }, [isAuthenticated, initializeData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Set default tab based on user role
  useEffect(() => {
    if (isAuthenticated && user) {
      setActiveTab(user.role === 'student' ? 'dashboard' : 'classes');
    }
  }, [isAuthenticated, user]);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-data.json';
    a.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        useAppStore.getState().importData(content);
      };
      reader.readAsText(file);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Student-only view
  if (user?.role === 'student') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Student Portal
                </h3>
                <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                    {user?.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={logout}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'checkin', label: 'Check In' },
                    { id: 'selfservice', label: 'Self Service' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="pb-8">
            {activeTab === 'dashboard' && <StudentDashboard />}
            {activeTab === 'checkin' && user?.studentId && <StudentCheckInPortal studentId={user.studentId} />}
            {activeTab === 'selfservice' && user?.studentId && <StudentSelfServicePortal studentId={user.studentId} />}
          </div>
        </main>
      </div>
    );
  }

  // Lecturer view (full access)
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                Noesis Attendance System
              </h1>
              <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                <span className="text-xs font-medium text-green-600 dark:text-green-300">
                  Lecturer
                </span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                  {user?.name}
                </span>
              </div>
              {user?.id && (
                <NotificationCenter userId={user.id} />
              )}
            </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search classes, students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border w-full sm:w-64 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Settings and Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={logout}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className={`absolute right-4 top-16 sm:top-auto sm:bottom-16 w-48 rounded-lg shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-50`}>
              <div className="p-2">
                <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Import Data</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <Download className="w-4 h-4" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Export Data</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
              {[
                { id: 'classes', label: 'Classes' },
                { id: 'attendance', label: 'Take Attendance' },
                { id: 'reports', label: 'Reports' },
                { id: 'charts', label: 'Analytics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="pb-8">
          {activeTab === 'classes' && <ClassList searchTerm={searchTerm} />}
          {activeTab === 'attendance' && <AttendanceTracker searchTerm={searchTerm} />}
          {activeTab === 'reports' && <AttendanceReports searchTerm={searchTerm} />}
          {activeTab === 'charts' && <AttendanceCharts />}
          {process.env.NODE_ENV === 'development' && activeTab === 'attendance' && <QRTest />}
        </div>
      </main>

      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}
