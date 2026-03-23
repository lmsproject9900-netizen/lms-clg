"use client";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setStudent(data);
    };

    fetchData();
  }, []);

  if (!student) return <p>Loading...</p>;

  return (
    <div className="p-10">
      <h1>Welcome {student.name}</h1>
      <p>USN: {student.usn}</p>
      <p>Department: {student.department}</p>
      <p>Semester: {student.semester}</p>
    </div>
  );
}