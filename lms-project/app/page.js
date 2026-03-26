"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, GraduationCap, Users, Zap, ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for token after component mounts
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // If logged in → redirect to dashboard
        if (token) {
          router.push("/student");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Interactive Courses",
      description: "Access engaging video lectures, quizzes, and assignments"
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Expert Instructors",
      description: "Learn from industry professionals with real-world experience"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Learning",
      description: "Connect with peers and participate in group discussions"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics"
    }
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LearnHub
            </span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Courses</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <div className="md:hidden">
            <button className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-8">
            <span className="text-blue-700 text-sm font-semibold">
              🚀 Welcome to the Future of Learning
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Transform Your Future
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              With Online Learning
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of students and professionals mastering new skills with our comprehensive learning platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/login")}
              className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border border-gray-200"
            >
              Learn More
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">200+</div>
              <div className="text-gray-600">Expert Instructors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Courses Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-blue-600">LearnHub?</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover what makes our platform the perfect choice for your learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of learners and start mastering new skills today
          </p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">LearnHub</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering learners worldwide with quality education
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Courses</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 LearnHub. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}