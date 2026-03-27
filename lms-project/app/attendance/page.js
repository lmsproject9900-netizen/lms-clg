"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AttendancePage() {
  const router = useRouter();
  const [attendance, setAttendance] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    total: 0,
    percentage: 0
  });

  const userUSN = typeof window !== 'undefined' ? localStorage.getItem("usn") : null;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Get student name from localStorage
    const name = localStorage.getItem("userName");
    if (name) setStudentName(name);
    
    fetchAttendance();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [attendance]);

  async function fetchAttendance() {
    if (!userUSN) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("usn", userUSN);  // Changed from student_usn to usn based on your schema

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      const map = {};
      data?.forEach((item) => {
        map[item.date] = {
          status: item.status,
          late: item.late || false,
          error: item.error || false,
        };
      });

      setAttendance(map);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    const records = Object.values(attendance);
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const halfDay = records.filter(r => r.status === "half_day" || r.status === "halfday").length;
    const total = records.length;
    const percentage = total > 0 ? ((present + halfDay * 0.5) / total * 100).toFixed(1) : 0;
    
    setStats({ present, absent, halfDay, total, percentage });
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
    if (record.status === "half_day" || record.status === "halfday") return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-sm";

    return "bg-gray-100 hover:bg-gray-200";
  };

  const getStatusIcon = (day) => {
    if (!day) return null;
    
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendance[dateKey];
    
    if (!record) return null;
    
    if (record.status === "present") return "✓";
    if (record.status === "absent") return "✗";
    if (record.status === "half_day" || record.status === "halfday") return "½";
    
    return null;
  };

  const getTooltipText = (day) => {
    if (!day) return "";
    
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendance[dateKey];
    
    if (!record) return "No record";
    
    let text = record.status.toUpperCase();
    if (record.late) text += " • Late";
    if (record.error) text += " • Punch Error";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Attendance Calendar</h1>
              </div>
              <p className="text-gray-600 mt-1">
                {studentName ? `${studentName} • ` : ""}USN: {userUSN || "Not available"}
              </p>
            </div>
            <button
              onClick={goToToday}
              className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Days</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                📆
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                ✅
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">
                ❌
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Half Day</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.halfDay}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">
                ½
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Attendance</p>
                <p className="text-2xl font-bold text-purple-600">{stats.percentage}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                📊
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 p-4 bg-gray-50 border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
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
                    className={`h-16 rounded-xl flex items-center justify-center relative transition-all duration-200 cursor-help ${statusStyle} ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    title={tooltipText}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${icon ? 'mr-1' : ''}`}>{day}</span>
                        {icon && (
                          <span className="text-xs font-bold ml-0.5">{icon}</span>
                        )}
                      </>
                    )}
                    
                    {/* Late Triangle Indicator */}
                    {day && attendance[`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`]?.late && (
                      <div className="absolute top-1 right-1">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-yellow-400"></div>
                      </div>
                    )}
                    
                    {/* Punch Error Indicator */}
                    {day && attendance[`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`]?.error && (
                      <div className="absolute bottom-1 right-1">
                        <span className="text-xs text-red-300">⚠</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded"></div>
                <span className="text-gray-600">Present ✓</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded"></div>
                <span className="text-gray-600">Absent ✗</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded"></div>
                <span className="text-gray-600">Half Day ½</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <span className="text-gray-600">No Record</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 rounded"></div>
                <span className="text-gray-600">Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-yellow-400"></div>
                <span className="text-gray-600">Late Check-in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Message */}
        {stats.total > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                stats.percentage >= 75 ? 'bg-green-100' : stats.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {stats.percentage >= 75 ? '🎉' : stats.percentage >= 60 ? '⚠️' : '❗'}
              </div>
              <div>
                <p className="text-sm text-gray-600">
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
    </div>
  );
}