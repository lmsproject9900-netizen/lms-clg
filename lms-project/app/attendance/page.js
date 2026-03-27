"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AttendancePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [currentDate, setCurrentDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [subjects, setSubjects] = useState({});
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });
  const [userUSN, setUserUSN] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [subjectList, setSubjectList] = useState([]);
  const [studentDepartment, setStudentDepartment] = useState("");
  const [studentSemester, setStudentSemester] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject_id: "",
    status: "present"
  });
  const [formError, setFormError] = useState("");

  // Check if mobile device
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set mounted state after component mounts on client
  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const usn = localStorage.getItem("usn");
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const department = localStorage.getItem("studentDepartment");
    const semester = localStorage.getItem("studentSemester");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (name) setStudentName(name);
    if (department) setStudentDepartment(department);
    if (semester) setStudentSemester(parseInt(semester));
    if (usn) {
      setUserUSN(usn);
      fetchSubjects(department, semester);
      fetchAttendance(usn);
    }
  }, [mounted, router]);

  useEffect(() => {
    if (mounted && Object.keys(attendance).length > 0) {
      calculateStats();
    }
  }, [attendance, mounted, selectedSubject]);

  async function fetchSubjects(department, semester) {
    try {
      let query = supabase
        .from("subjects")
        .select(`
          id,
          name,
          subject_code,
          department,
          semester
        `);
      
      // Filter by department and semester if available
      if (department) {
        query = query.eq("department", department);
      }
      if (semester) {
        query = query.eq("semester", semester);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching subjects:", error);
        return;
      }

      const subjectMap = {};
      data?.forEach((subject) => {
        subjectMap[subject.id] = subject;
      });
      setSubjects(subjectMap);
      setSubjectList(data || []);
      
      // Set default subject if available
      if (data && data.length > 0 && !formData.subject_id) {
        setFormData(prev => ({ ...prev, subject_id: data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }

  async function fetchAttendance(usn) {
    try {
      setLoading(true);
      let query = supabase
        .from("attendance")
        .select("*")
        .eq("student_usn", usn);

      if (selectedSubject !== "all") {
        query = query.eq("subject_id", selectedSubject);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      const map = {};
      data?.forEach((item) => {
        const key = item.date;
        if (!map[key]) {
          map[key] = {
            status: item.status,
            subjects: []
          };
        }
        map[key].subjects.push({
          subjectId: item.subject_id,
          status: item.status
        });
        
        if (map[key].subjects.some(s => s.status === "absent")) {
          map[key].status = "absent";
        } else if (map[key].subjects.every(s => s.status === "present")) {
          map[key].status = "present";
        } else {
          map[key].status = "partial";
        }
      });

      setAttendance(map);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAttendance() {
    if (!formData.date || !formData.subject_id || !formData.status) {
      setFormError("Please fill in all fields");
      return;
    }

    setModalLoading(true);
    setFormError("");

    try {
      // Check if attendance already exists for this date and subject
      const { data: existing } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_usn", userUSN)
        .eq("subject_id", formData.subject_id)
        .eq("date", formData.date);

      if (existing && existing.length > 0) {
        setFormError("Attendance already recorded for this subject on this date");
        setModalLoading(false);
        return;
      }

      // Insert new attendance record
      const { error } = await supabase
        .from("attendance")
        .insert({
          student_usn: userUSN,
          subject_id: formData.subject_id,
          date: formData.date,
          status: formData.status
        });

      if (error) {
        console.error("Error adding attendance:", error);
        setFormError("Failed to add attendance. Please try again.");
        return;
      }

      // Reset form and close modal
      setFormData({
        date: new Date().toISOString().split('T')[0],
        subject_id: subjectList[0]?.id || "",
        status: "present"
      });
      setShowModal(false);
      
      // Refresh attendance data
      fetchAttendance(userUSN);
      
    } catch (error) {
      console.error("Error:", error);
      setFormError("An error occurred. Please try again.");
    } finally {
      setModalLoading(false);
    }
  }

  function calculateStats() {
    const records = Object.values(attendance);
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const total = records.length;
    const percentage = total > 0 ? (present / total * 100).toFixed(1) : 0;
    
    setStats({ present, absent, total, percentage });
  }

  // Don't render anything until mounted on client
  if (!mounted || !currentDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];

  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  const getStatusStyle = (day) => {
    if (!day) return "bg-gray-100";

    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendance[dateKey];

    if (!record) return "bg-gray-100 hover:bg-gray-200";
    
    if (record.status === "present") return "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm";
    if (record.status === "absent") return "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm";
    if (record.status === "partial") return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-sm";

    return "bg-gray-100 hover:bg-gray-200";
  };

  const getStatusIcon = (day) => {
    if (!day) return null;
    
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendance[dateKey];
    
    if (!record) return null;
    
    if (record.status === "present") return "✓";
    if (record.status === "absent") return "✗";
    if (record.status === "partial") return "½";
    
    return null;
  };

  const getTooltipText = (day) => {
    if (!day) return "";
    
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendance[dateKey];
    
    if (!record) return "No record";
    
    let text = record.status.toUpperCase();
    if (record.status === "partial") {
      const presentCount = record.subjects?.filter(s => s.status === "present").length || 0;
      const totalCount = record.subjects?.length || 0;
      text += ` (${presentCount}/${totalCount} subjects)`;
    }
    return text;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    if (userUSN) {
      fetchAttendance(userUSN);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-lg">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects[subjectId];
    return subject ? `${subject.name} (${subject.subject_code})` : "Unknown Subject";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        
        {/* Header Section with Add Button */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl">📅</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Attendance Calendar</h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {studentName ? `${studentName} • ` : ""}USN: {userUSN || "Not available"}
              </p>
              {studentDepartment && studentSemester && (
                <p className="text-xs text-gray-500 mt-1">
                  {studentDepartment} • Semester {studentSemester}
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={goToToday}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Today
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Subject Filter - Shows subjects from the subjects table */}
        {subjectList.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subject</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubjectChange("all")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedSubject === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Subjects
              </button>
              {subjectList.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectChange(subject.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    selectedSubject === subject.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Days</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center text-base sm:text-xl">
                📆
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Present</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center text-base sm:text-xl">
                ✅
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Absent</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center text-base sm:text-xl">
                ❌
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Attendance</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.percentage}%</p>
              </div>
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center text-base sm:text-xl">
                📊
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={goToPreviousMonth}
                className="p-1 sm:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-1 sm:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2 p-2 sm:p-4 bg-gray-50 border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center font-semibold text-gray-600 text-[10px] sm:text-xs md:text-sm py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2">
              {daysArray.map((day, index) => {
                const isToday = day === new Date().getDate() && 
                                month === new Date().getMonth() && 
                                year === new Date().getFullYear();
                const statusStyle = getStatusStyle(day);
                const icon = getStatusIcon(day);
                const tooltipText = getTooltipText(day);
                
                return (
                  <div
                    key={index}
                    className={`h-10 sm:h-12 md:h-16 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center relative transition-all duration-200 cursor-help ${statusStyle} ${isToday ? 'ring-1 sm:ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2' : ''}`}
                    title={tooltipText}
                  >
                    {day && (
                      <>
                        <span className={`text-xs sm:text-sm md:text-base font-medium ${icon ? 'mr-0.5 sm:mr-1' : ''}`}>{day}</span>
                        {icon && (
                          <span className="text-[8px] sm:text-xs font-bold ml-0.5">{icon}</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 p-3 sm:p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Legend</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-br from-green-500 to-green-600 rounded"></div>
                <span className="text-gray-600">Present ✓</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-br from-red-500 to-red-600 rounded"></div>
                <span className="text-gray-600">Absent ✗</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded"></div>
                <span className="text-gray-600">Partial Day ½</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gray-200 rounded"></div>
                <span className="text-gray-600">No Record</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border border-blue-500 rounded"></div>
                <span className="text-gray-600">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Message */}
        {stats.total > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-md">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                stats.percentage >= 75 ? 'bg-green-100' : stats.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {stats.percentage >= 75 ? '🎉' : stats.percentage >= 60 ? '⚠️' : '❗'}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  {stats.percentage >= 75 ? (
                    <span className="text-green-700 font-medium">Excellent!</span>
                  ) : stats.percentage >= 60 ? (
                    <span className="text-yellow-700 font-medium">Keep it up!</span>
                  ) : (
                    <span className="text-red-700 font-medium">Needs improvement!</span>
                  )}
                  {' '}Your attendance is <strong className="text-gray-900">{stats.percentage}%</strong> this semester.
                  {stats.percentage < 75 && ' Aim for at least 75% attendance.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Attendance</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Date Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Subject Selector - Dropdown from subjects table */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a subject</option>
                    {subjectList.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.subject_code})
                      </option>
                    ))}
                  </select>
                  {subjectList.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No subjects found. Please ensure subjects are added for your department and semester.
                    </p>
                  )}
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "present" })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.status === "present"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Present ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "absent" })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.status === "absent"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Absent ✗
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttendance}
                  disabled={modalLoading || !formData.subject_id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    "Add Attendance"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}