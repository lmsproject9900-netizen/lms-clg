"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    router.push("/login");
    setIsMenuOpen(false);
  };

  const navigation = [
    { name: "Home", href: "/", icon: "Home", requireAuth: false },
    { name: "Dashboard", href: "/student", icon: "GraduationCap", requireAuth: true },
    { name: "", href: "/courses", icon: "BookOpen", requireAuth: true },
    { name: "Calendar", href: "/calendar", icon: "Calendar", requireAuth: true },
    { name: "Community", href: "/community", icon: "Users", requireAuth: true },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.requireAuth || (item.requireAuth && isLoggedIn)
  );

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push("/")}>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LearnHub
            </span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="text-gray-600 text-sm hidden sm:inline">
              {isLoggedIn ? "Student Portal" : "Learning Platform"}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{userName || "Student"}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.name}</span>
                </button>
              );
            })}
            
            {isLoggedIn ? (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    router.push("/profile");
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center space-x-3"
                >
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-3"
                >
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => {
                    router.push("/login");
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    router.push("/signup");
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}