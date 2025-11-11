import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Play,
  Clock,
  Briefcase,
  GraduationCap,
  FileText,
  Bell,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollToTop from "@/components/ScrollToTop";

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of images for hero slideshow
  const heroImages = [
    "https://www.hitecuni.edu.pk/www/img/slider/1.jpg",
    "https://www.hitecuni.edu.pk/www/img/slider/3.jpg",
    "https://w0.peakpx.com/wallpaper/440/401/HD-wallpaper-hitec-university-of-science-and-technology-taxila-education-university-buildings-landscape.jpg",
    "https://i.dawn.com/primary/2020/02/5e3893cee484e.jpg"
  ];

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const smoothScroll = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Digital Application Submission",
      description:
        "Students can submit leaves, complaints, course freezes, and other requests online with automatic routing to advisors.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Shield,
      title: "Automated Approval Workflows",
      description:
        "Requests flow automatically from students to advisors, teachers, and HOP with transparent tracking and digital signatures.",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Comprehensive dashboards showing student performance, attendance tracking, and request status monitoring.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "AI-Powered Chatbot",
      description:
        "Intelligent assistant provides instant guidance on academic procedures, reducing advisor workload significantly.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="https://crystalpng.com/wp-content/uploads/2024/09/HITEC_University_Logo.png"
                alt="HITEC University Logo"
                className="h-12 w-auto"
              />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart HITEC Advisory System
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => smoothScroll("features")}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => smoothScroll("how-it-works")}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => smoothScroll("stats")}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Stats
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="font-semibold">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 animate-bounce delay-500"></div>
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-15 animate-bounce delay-700"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-0 px-4 py-2 shadow-lg">
                <Sparkles className="w-4 h-4 mr-1" />
                HITEC University Innovation
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Smart Advisory with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Digital Transformation
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Revolutionary batch advisory system that streamlines academic processes, automates approvals, and enhances communication between students, advisors, teachers, and administration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all h-12 font-semibold"
                  asChild
                >
                  <Link to="/register">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="group h-12 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 font-semibold">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center bg-green-50 px-4 py-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">Free for HITEC Students</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-blue-700 font-medium">24/7 Support</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image with Auto-Rotation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl opacity-20 blur-3xl"></div>
              
              {/* Rotating Images Container */}
              <div className="relative rounded-3xl shadow-2xl w-full overflow-hidden h-80 ring-4 ring-white/50">
                {heroImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`HITEC University Campus ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover rounded-3xl transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>

              {/* Slideshow Indicators */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-blue-600 w-8 shadow-lg' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-2xl animate-bounce border-2 border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    System Active
                  </span>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-2xl border-2 border-blue-100">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-900">100% Secure</span>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border-2 border-purple-100">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-900">Real-Time Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              Our Impact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by HITEC Community
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Making academic management efficient and transparent
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mb-2 text-4xl font-bold text-gray-900">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-gray-600 font-medium">Active Students</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mb-2 text-4xl font-bold text-gray-900">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-gray-600 font-medium">Batch Advisors</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="mb-2 text-4xl font-bold text-gray-900">
                <AnimatedCounter end={80} suffix="%" />
              </div>
              <div className="text-gray-600 font-medium">Faster Approvals</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="mb-2 text-4xl font-bold text-gray-900">
                <AnimatedCounter end={1000} suffix="+" />
              </div>
              <div className="text-gray-600 font-medium">Requests Processed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
              <Zap className="w-4 h-4 mr-1" />
              Key Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Academic Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform automates advisory processes while maintaining transparency and efficiency for all stakeholders
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-transparent bg-white overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className={`mt-4 h-1 bg-gradient-to-r ${feature.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-green-600 to-teal-600 text-white border-0 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple process, powerful results in just three steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400"
                  alt="Step 1"
                  className="w-full h-56 object-cover rounded-2xl shadow-xl group-hover:shadow-2xl transition-shadow ring-4 ring-white"
                />
                <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Register & Setup</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your account with role-based access. Students enter their batch and ID, advisors select their assigned batch.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400"
                  alt="Step 2"
                  className="w-full h-56 object-cover rounded-2xl shadow-xl group-hover:shadow-2xl transition-shadow ring-4 ring-white"
                />
                <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Submit Requests</h3>
              <p className="text-gray-600 leading-relaxed">
                Students submit applications digitally. Requests are automatically routed to advisors, teachers, and HOP for approval.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=400"
                  alt="Step 3"
                  className="w-full h-56 object-cover rounded-2xl shadow-xl group-hover:shadow-2xl transition-shadow ring-4 ring-white"
                />
                <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Track & Monitor</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time notifications keep everyone updated. Comprehensive dashboards provide transparency throughout the process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Digitalize Your Advisory Process?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join HITEC University in transforming academic management with our intelligent batch advisory system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl h-14 px-8 font-bold text-lg"
              asChild
            >
              <Link to="/register">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 h-14 px-8 font-bold text-lg"
            >
              Contact Support
            </Button>
          </div>
          <p className="text-blue-200 mt-6 text-sm font-medium">
            Free for all HITEC students and faculty • Full support included
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img
                  src="https://crystalpng.com/wp-content/uploads/2024/09/HITEC_University_Logo.png"
                  alt="HITEC Logo"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Smart HITEC Batch Advisory System - Transforming academic management through intelligent automation.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#stats" className="hover:text-white transition-colors">
                    Statistics
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">For Users</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 HITEC University. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}