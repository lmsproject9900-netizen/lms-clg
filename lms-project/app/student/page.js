"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        const usn = localStorage.getItem("usn");
        
        // Check if user is logged in
        if (!token) {
          console.log("No token found, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("Fetching student data from /api/data...");
        
        // Use your existing /api/data endpoint
        const res = await fetch("/api/data", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          console.log("Invalid token, redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("usn");
          localStorage.removeItem("userName");
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status}`);
        }

        const data = await res.json();
        console.log("Student data received:", data);
        
        if (!data || !data.usn) {
          throw new Error("No student data received");
        }

        setStudent(data);
        
        // Store student info in localStorage for header
        if (data.name) {
          localStorage.setItem("userName", data.name);
        }
        if (data.usn) {
          localStorage.setItem("usn", data.usn);
        }

      } catch (error) {
        console.error("Error fetching student data:", error);
        setError(error.message || "Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usn");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  // Calculate grade from marks (example calculation)
  const getGradeFromMarks = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {student.name?.charAt(0) || "S"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {student.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {student.usn} • {student.department || "Computer Science"} • Semester {student.semester || "3"} • Section {student.section || "A"}
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {student.email && (
                    <span className="text-sm text-gray-500">📧 {student.email}</span>
                  )}
                  {student.mobile && (
                    <span className="text-sm text-gray-500">📞 {student.mobile}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-600">{student.total_subjects || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                📚
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Passed Subjects</p>
                <p className="text-2xl font-bold text-green-600">{student.passed_subjects || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                ✅
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Failed Subjects</p>
                <p className="text-2xl font-bold text-red-600">{student.failed_subjects || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">
                ⚠️
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Semester</p>
                <p className="text-2xl font-bold text-purple-600">{student.semester || 3}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                🎓
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {["overview", "academics", "profile"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "overview" ? "Overview" : 
                   tab === "academics" ? "Academics" : "Profile"}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Academic Progress */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">📊</span> Academic Progress
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Passed Subjects</span>
                    <span>{student.passed_subjects || 0} / {student.total_subjects || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((student.passed_subjects || 0) / (student.total_subjects || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Failed Subjects</span>
                    <span>{student.failed_subjects || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${((student.failed_subjects || 0) / (student.total_subjects || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong className="text-gray-800">Progress Summary:</strong> You have successfully completed 
                    {student.passed_subjects || 0} out of {student.total_subjects || 0} subjects this semester.
                  </p>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 {student.failed_subjects > 0 
                      ? `You have ${student.failed_subjects} subject(s) to improve. Consider retaking them next semester.`
                      : "Great job! You've passed all your subjects this semester!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">👤</span> Student Information
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">USN</span>
                  <span className="font-medium text-gray-900">{student.usn}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium text-gray-900">{student.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium text-gray-900">{student.department || "Computer Science"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Semester</span>
                  <span className="font-medium text-gray-900">{student.semester || 3}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Section</span>
                  <span className="font-medium text-gray-900">{student.section || "A"}</span>
                </div>
                {student.email && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900">{student.email}</span>
                  </div>
                )}
                {student.mobile && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Mobile</span>
                    <span className="font-medium text-gray-900">{student.mobile}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Academics Tab Content */}
        {activeTab === "academics" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">📖</span> Academic Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Subjects Overview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Subjects</span>
                      <span className="font-medium text-gray-900">{student.total_subjects || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Passed Subjects</span>
                      <span className="font-medium text-green-600">{student.passed_subjects || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Failed Subjects</span>
                      <span className="font-medium text-red-600">{student.failed_subjects || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Completion Rate</span>
                        <span>{((student.passed_subjects || 0) / (student.total_subjects || 1) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full"
                          style={{ width: `${((student.passed_subjects || 0) / (student.total_subjects || 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">⚙️</span> Profile Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">USN</label>
                  <input
                    type="text"
                    value={student.usn}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={student.name}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={student.department || "Computer Science"}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="text"
                    value={student.semester || 3}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={student.section || "A"}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={student.email || `${student.usn}@university.edu`}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={student.mobile || "Not provided"}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={student.failed_subjects > 0 ? "Needs Improvement" : "Good Standing"}
                    disabled
                    className={`w-full px-4 py-2 border rounded-lg ${
                      student.failed_subjects > 0 
                        ? "bg-yellow-100 border-yellow-300 text-yellow-800" 
                        : "bg-green-100 border-green-300 text-green-800"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ℹ️ Profile information is managed by the administration. Contact your department office for updates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}