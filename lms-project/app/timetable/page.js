"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);

  // 👉 CHANGE THIS (later take from login)
  const department = "AIML";
  const semester = 2;

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("timetable")
      .select(`
        *,
        subjects(name)
      `)
      .eq("department", department)
      .eq("semester", semester)
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // 👉 Group by day
    const grouped = {};
    daysOrder.forEach((day) => (grouped[day] = []));

    data.forEach((item) => {
      if (!grouped[item.day]) grouped[item.day] = [];
      grouped[item.day].push(item);
    });

    setTimetable(grouped);
    setLoading(false);
  };

  if (loading) return <p className="p-6">Loading...</p>;

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
              timetable[day]?.map((item) => (
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