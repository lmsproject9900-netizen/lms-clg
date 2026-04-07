"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AttendancePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [timetable, setTimetable] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [studentName, setStudentName] = useState("");
  const [userUSN, setUserUSN] = useState("");
  const [userSemester, setUserSemester] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userBatch, setUserBatch] = useState("");

  const [subjectList, setSubjectList] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    subject_id: "",
  });

  const [formError, setFormError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  // ---------- INIT ----------
  useEffect(() => {
    setMounted(true);

    const usn = localStorage.getItem("usn");
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const semester = localStorage.getItem("studentSemester");
    const department = localStorage.getItem("studentDepartment");
    const batch = localStorage.getItem("studentBatch");

    if (!token) {
      router.push("/login");
      return;
    }

    if (name) setStudentName(name);
    if (semester) setUserSemester(semester);
    if (department) setUserDepartment(department);
    if (batch) setUserBatch(batch);

    if (usn) {
      setUserUSN(usn);
      loadAllData(usn, semester, department, batch);
    }
  }, []);

  // ---------- LOAD ALL DATA ----------
  async function loadAllData(usn, semester, department, batch) {
    setLoading(true);
    try {
      const subjectsMap = await fetchSubjects(semester, department);
      const timetableData = await fetchTimetable(semester, department, batch, subjectsMap);
      setTimetable(timetableData);
      await fetchAttendance(usn);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  // ---------- FETCH SUBJECTS AND CREATE MAP ----------
  async function fetchSubjects(semester, department) {
    const { data: subjectsData, error: subjectsError } = await supabase
      .from("subjects")
      .select(`
        *,
        teachers (
          name
        )
      `)
      .eq("semester", semester)
      .ilike("department", department);

    if (subjectsError) {
      console.error("Subjects error:", subjectsError);
      return {};
    }

    const subjectsMap = {};
    subjectsData?.forEach(subject => {
      subjectsMap[subject.id] = {
        name: subject.name,
        code: subject.subject_code,
        teacher: subject.teachers?.name || "Not Assigned"
      };
    });

    setSubjectList(subjectsData || []);
    return subjectsMap;
  }

  // ---------- FETCH TIMETABLE AND COMBINE WITH SUBJECTS ----------
  async function fetchTimetable(semester, department, batch, subjectsMap) {
    let query = supabase
      .from("timetable")
      .select("*")
      .eq("semester", semester)
      .eq("department", department);

    if (batch) {
      query = query.eq("batch", batch);
    }

    const { data: timetableData, error: timetableError } = await query;

    if (timetableError) {
      console.error("Timetable error:", timetableError);
      return {};
    }

    const timetableMap = {};
    const dayMap = {
      "Monday": 1, "Tuesday": 2, "Wednesday": 3,
      "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0
    };

    timetableData?.forEach(item => {
      const dayNum = dayMap[item.day];
      if (dayNum !== undefined) {
        if (!timetableMap[dayNum]) timetableMap[dayNum] = [];
        
        const subject = subjectsMap[item.subject_id];
        if (subject) {
          timetableMap[dayNum].push({
            subject_id: item.subject_id,
            subject_name: subject.name,
            subject_code: subject.code,
            teacher_name: subject.teacher,
            start_time: item.start_time,
            end_time: item.end_time
          });
        }
      }
    });

    return timetableMap;
  }

  // ---------- FETCH ATTENDANCE ----------
  async function fetchAttendance(usn) {
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_usn", usn);

    if (attendanceError) {
      console.error("Attendance error:", attendanceError);
      return;
    }

    const attendanceMap = {};
    attendanceData?.forEach(item => {
      const date = item.date;
      if (!attendanceMap[date]) attendanceMap[date] = {};
      
      const status = item.status?.toLowerCase();
      if (status === "approved" || status === "present") {
        attendanceMap[date][item.subject_id] = "present";
      } else if (status === "absent") {
        attendanceMap[date][item.subject_id] = "absent";
      } else if (status === "pending") {
        attendanceMap[date][item.subject_id] = "pending";
      }
    });

    setAttendance(attendanceMap);
  }

  // ---------- REQUEST ATTENDANCE ----------
  async function handleRequestAttendance() {
    if (!userUSN || !formData.date || !formData.subject_id) {
      setFormError("Please fill all fields");
      return;
    }

    setModalLoading(true);
    setFormError("");
    setRequestSuccess("");

    try {
      const { data: existing } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_usn", userUSN)
        .eq("subject_id", formData.subject_id)
        .eq("date", formData.date);

      if (existing && existing.length > 0) {
        setFormError("Request already submitted for this subject on this date");
        setModalLoading(false);
        return;
      }

      const { error } = await supabase.from("attendance").insert([{
        student_usn: userUSN,
        subject_id: formData.subject_id,
        date: formData.date,
        status: "pending"
      }]);

      if (error) throw error;

      setRequestSuccess("Request submitted! Waiting for approval.");
      setTimeout(() => {
        setShowModal(false);
        fetchAttendance(userUSN);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          subject_id: subjectList[0]?.id || ""
        });
        setRequestSuccess("");
      }, 2000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  // ---------- CALENDAR FUNCTIONS ----------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDaySchedule = (date) => {
    const dayOfWeek = date.getDay();
    return timetable[dayOfWeek] || [];
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const schedule = getDaySchedule(date);
    const attendanceData = attendance[dateKey] || {};
    
    if (schedule.length === 0) return;
    
    const subjectsWithStatus = schedule.map(classItem => ({
      ...classItem,
      status: attendanceData[classItem.subject_id] || "absent"
    }));
    
    const presentCount = subjectsWithStatus.filter(s => s.status === "present").length;
    
    setSelectedDateDetails({
      date: dateKey,
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      subjects: subjectsWithStatus,
      totalClasses: schedule.length,
      presentCount: presentCount,
      absentCount: schedule.length - presentCount
    });
    setShowDetailModal(true);
  };

  const getDateInfo = (day) => {
    if (!day) return null;
    
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const schedule = getDaySchedule(date);
    const attendanceData = attendance[dateKey] || {};
    
    if (schedule.length === 0) return null;
    
    let presentCount = 0;
    schedule.forEach(c => {
      if (attendanceData[c.subject_id] === "present") presentCount++;
    });
    
    return { totalClasses: schedule.length, presentCount };
  };

  if (!mounted) return <div className="p-8 text-center">Loading...</div>;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= totalDays; d++) daysArray.push(d);

  const getStyle = (day) => {
    if (!day) return "bg-gray-100";
    const info = getDateInfo(day);
    if (!info) return "bg-white border-2 border-gray-200 opacity-50";
    
    if (info.presentCount === info.totalClasses)
      return "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md cursor-pointer hover:scale-105 transition-all";
    if (info.presentCount > 0)
      return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md cursor-pointer hover:scale-105 transition-all";
    return "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md cursor-pointer hover:scale-105 transition-all";
  };

  const getDisplayText = (day) => {
    const info = getDateInfo(day);
    return info ? `${info.presentCount}/${info.totalClasses}` : null;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-xl text-gray-600">Loading attendance...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Attendance Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                {studentName} • <span className="font-mono">{userUSN}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Semester: {userSemester} | Department: {userDepartment} | Batch: {userBatch || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <span>📝</span>
              Request Attendance
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold">
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold">
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-3">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {daysArray.map((day, i) => {
              const info = day ? getDateInfo(day) : null;
              const clickable = day && info && info.totalClasses > 0;
              return (
                <div 
                  key={i} 
                  className={`h-24 rounded-xl flex flex-col items-center justify-center transition-all ${getStyle(day)} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => clickable && handleDateClick(day)}
                >
                  {day && (
                    <>
                      <span className="text-xl font-bold mb-1 text-white">{day}</span>
                      {info && <span className="text-sm font-semibold text-white">{getDisplayText(day)}</span>}
                      {!info && <span className="text-xs text-gray-400">No class</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t-2">
            <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-green-500 rounded"></div>
                <span>Full Attendance</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-yellow-500 rounded"></div>
                <span>Partial Attendance</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-red-500 rounded"></div>
                <span>No Attendance</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded"></div>
                <span>No Class</span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Modal - Improved Visibility */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Attendance</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  Submit a request to mark your attendance. Your faculty will review and approve it.
                </p>
                
                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
                    <p className="font-medium">{formError}</p>
                  </div>
                )}
                
                {requestSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded">
                    <p className="font-medium">{requestSuccess}</p>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">Select Subject</label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 font-medium bg-white"
                    >
                      {subjectList.map(s => (
                        <option key={s.id} value={s.id} className="text-gray-800 py-2">
                          {s.name} ({s.subject_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg mt-4 border border-blue-200">
                    <p className="text-xs text-blue-800">
                      ℹ️ Your request will be sent to the faculty for approval. Once approved, it will appear as present in your attendance.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        setFormError("");
                        setRequestSuccess("");
                      }} 
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRequestAttendance} 
                      disabled={modalLoading} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {modalLoading ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedDateDetails && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Details</h2>
                    <p className="text-gray-600 mt-1 text-lg">
                      {selectedDateDetails.dayName}, {selectedDateDetails.date}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDetailModal(false)} 
                    className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <p className="text-gray-800 font-semibold text-lg">Attendance Summary</p>
                  <div className="mt-2 flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Present: <strong className="text-green-600 text-lg">{selectedDateDetails.presentCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Absent: <strong className="text-red-600 text-lg">{selectedDateDetails.absentCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-700">Total: <strong className="text-gray-800 text-lg">{selectedDateDetails.totalClasses}</strong></span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(selectedDateDetails.presentCount / selectedDateDetails.totalClasses) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round((selectedDateDetails.presentCount / selectedDateDetails.totalClasses) * 100)}% Attendance
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-3">Subject-wise Details</h3>
                <div className="space-y-3">
                  {selectedDateDetails.subjects.map((subject, idx) => (
                    <div key={idx} className="border-2 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-base">{subject.subject_name}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Code:</span> {subject.subject_code}
                            </p>
                            {subject.teacher_name && subject.teacher_name !== "Not Assigned" && (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">👨‍🏫 Teacher:</span> {subject.teacher_name}
                              </p>
                            )}
                            {subject.start_time && subject.end_time && (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">🕐 Time:</span> {subject.start_time} - {subject.end_time}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          subject.status === 'present' ? 'bg-green-100 text-green-700 border border-green-300' :
                          subject.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                          {subject.status === 'present' ? '✓ PRESENT' :
                           subject.status === 'pending' ? '⏳ PENDING' :
                           '✗ ABSENT'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 rounded-b-2xl flex justify-end">
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}