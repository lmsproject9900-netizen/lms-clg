"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // adjust path if needed

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("timetable")
        .select(`
          id,
          day,
          start_time,
          end_time,
          batch,
          subjects(name)
        `)
        .eq("department", "AIML")
        .eq("semester", 2)
        .eq("batch", "3LOK3")
        .order("start_time");

      if (error) {
        console.error("Supabase Error:", error);
      } else {
        console.log("DATA:", data);
        setData(data);
      }
    };

    fetchData();
  }, []);

  const grouped = days.reduce((acc, day) => {
    acc[day] = data.filter((item) => item.day === day);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📅 Timetable</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {days.map((day) => (
          <div key={day} className="bg-white shadow rounded-xl p-4">
            <h2 className="font-semibold mb-3">{day}</h2>

            {grouped[day].length === 0 ? (
              <p className="text-gray-400">No classes</p>
            ) : (
              grouped[day].map((item) => (
                <div key={item.id} className="border p-3 rounded mb-2 bg-gray-50">
                  <p className="font-medium">
                    {item.subjects?.name || "Subject"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.start_time} - {item.end_time}
                  </p>
                  <p className="text-xs text-gray-400">
                    Batch: {item.batch}
                  </p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}