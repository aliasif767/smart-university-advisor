import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Users, BarChart3, Briefcase, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Array of images for slideshow
  const heroImages = [
    "https://www.hitecuni.edu.pk/www/img/slider/1.jpg",
    "https://www.hitecuni.edu.pk/www/img/slider/3.jpg",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left Side - Hero Section with Auto-Rotating Images */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Rotating Image Container */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`HITEC University ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-30' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        {/* Slideshow Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">Smart HITEC Batch Advisory System</h1>
            <p className="text-xl mb-8 text-blue-100">
              Streamline academic advisory processes with our intelligent platform for students, advisors, teachers, and administrators
            </p>

            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 transition-all hover:bg-white/20">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm">Digital application submission</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 transition-all hover:bg-white/20">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm">Automated approval workflows</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 transition-all hover:bg-white/20">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm">Multi-role coordination</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 transition-all hover:bg-white/20">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm">Real-time notifications & tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            className="w-full h-auto text-blue-500/20"
            fill="currentColor"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10 border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10 pr-12 border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Sign In to Dashboard
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/register"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Don't have an account? <span className="font-semibold">Create one</span>
                  </Link>
                </div>
              </form>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}