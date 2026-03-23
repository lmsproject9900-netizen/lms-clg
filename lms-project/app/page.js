"use client";

import { useEffect } from "react";

export default function Home() {

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If logged in → go to dashboard
    if (token) {
      window.location.href = "/student";
    }
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      
      <h1 className="text-3xl font-bold mb-6">
        🎓 LMS Portal
      </h1>

      <p className="mb-4 text-gray-600">
        Welcome! Please login to continue
      </p>

      <a
        href="/login"
        className="bg-blue-500 text-white px-6 py-2 rounded-lg"
      >
        Go to Login
      </a>

    </div>
  );
}