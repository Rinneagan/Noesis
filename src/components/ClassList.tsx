'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Class, Student } from '@/types';
import { Search, Plus, Users, Edit, Trash2, UserPlus, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';

interface ClassListProps {
  searchTerm: string;
}

export default function ClassList({ searchTerm }: ClassListProps) {
  const { classes, addClass, deleteClass, addStudentToClass, removeStudentFromClass } = useAppStore();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [newStudent, setNewStudent] = useState({ name: '', email: '', studentId: '' });

  const filteredClasses = useMemo(() => {
    return classes.filter(classItem => 
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.students.some(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [classes, searchTerm]);

  const handleAddClass = () => {
    if (newClass.name && newClass.description) {
      addClass({
        ...newClass,
        students: [],
      });
      setNewClass({ name: '', description: '' });
      setShowAddClass(false);
    }
  };

  const handleAddStudent = () => {
    if (selectedClass && newStudent.name && newStudent.email && newStudent.studentId) {
      const student = {
        ...newStudent,
        id: Date.now().toString(),
      };
      addStudentToClass(selectedClass.id, student);
      setNewStudent({ name: '', email: '', studentId: '' });
      setShowAddStudent(false);
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      deleteClass(classId);
    }
  };

  const handleExportClassData = (classItem: Class) => {
    const csvData = classItem.students.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Email': student.email,
    }));
    exportToCSV(csvData, `${classItem.name.replace(/\s+/g, '_')}_students`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Classes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredClasses.length} of {classes.length} classes shown
          </p>
        </div>
        <button
          onClick={() => setShowAddClass(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {showAddClass && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New Class</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class Name
              </label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter class name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newClass.description}
                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Enter class description"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                onClick={handleAddClass}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Class
              </button>
              <button
                onClick={() => setShowAddClass(false)}
                className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredClasses.map((classItem) => (
          <div
            key={classItem.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedClass(classItem)}
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {classItem.name}
                </h3>
                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleExportClassData(classItem)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Export student list"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{classItem.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {classItem.students.length} students
                  </span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedClass.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedClass.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Student</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button
                    onClick={() => setSelectedClass(null)}
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
              
              {showAddStudent && (
                <div className="mb-4 sm:mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New Student</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Student Name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Student ID"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-4">
                    <button
                      onClick={handleAddStudent}
                      className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Student
                    </button>
                    <button
                      onClick={() => setShowAddStudent(false)}
                      className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Students ({selectedClass.students.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedClass.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs sm:text-sm">
                          {student.studentId}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${student.name} from this class?`)) {
                              removeStudentFromClass(selectedClass.id, student.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
