"use client";
import { useState } from "react";

export default function Login() {
  const [usn, setUsn] = useState("");
  const [name, setName] = useState("");

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ usn, name }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "/student";
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="p-10">
      <h1>Login</h1>

      <input
        placeholder="USN"
        value={usn}
        onChange={(e) => setUsn(e.target.value)}
        className="border p-2 block"
      />

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 block mt-2"
      />

      <button onClick={handleLogin} className="bg-blue-500 text-white p-2 mt-4">
        Login
      </button>
    </div>
  );
}