"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [semester, setSemester] = useState(null);

  useEffect(() => {
    const dept = localStorage.getItem("studentDepartment");
    const sem = localStorage.getItem("studentSemester");

    if (!dept || !sem) {
      console.error("Student data not found. Please login again.");
      setLoading(false);
      return;
    }

    setDepartment(dept);
    setSemester(sem);

    fetchTimetable(dept, sem);
  }, []);

  const fetchTimetable = async (dept, sem) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("timetable")
      .select(`
        *,
        subjects(name)
      `)
      .eq("department", dept)
      .eq("semester", Number(sem))
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching timetable:", error);
      setLoading(false);
      return;
    }

    // Group by day
    const grouped = {};
    daysOrder.forEach((day) => (grouped[day] = []));

    data.forEach((item) => {
      if (!grouped[item.day]) grouped[item.day] = [];
      grouped[item.day].push(item);
    });

    setTimetable(grouped);
    setLoading(false);
  };

  if (loading) return <p className="p-6">Loading timetable...</p>;

  if (!department || !semester) {
    return (
      <p className="p-6 text-red-500 text-center">
        Student not logged in. Please login again.
      </p>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {department} - Semester {semester} Timetable
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOrder.map((day) => (
          <div key={day} className="bg-gray-800 rounded-2xl shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              {day}
            </h2>

            {timetable[day]?.length === 0 ? (
              <p className="text-gray-400">No classes</p>
            ) : (
              timetable[day].map((item) => (
                <div
                  key={item.id}
                  className="mb-3 p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition"
                >
                  <p className="font-semibold">
                    {item.subjects?.name || "Subject"}
                  </p>

                  <p className="text-sm text-gray-300">
                    {item.start_time} - {item.end_time}
                  </p>

                  {item.batch && (
                    <p className="text-xs text-yellow-400">
                      Batch: {item.batch}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}