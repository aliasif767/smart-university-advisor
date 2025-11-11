import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  UserPlus,
  GraduationCap,
  Shield,
  Users,
  CheckCircle,
  Briefcase,
  Mail,
  Lock,
  User,
  Hash,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
    studentId: "",
    batch: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Array of images for slideshow
  const heroImages = [
    "https://www.hitecuni.edu.pk/www/img/slider/1.jpg",
    "https://www.hitecuni.edu.pk/www/img/slider/3.jpg",
    "https://i.dawn.com/primary/2020/03/5e6018765baec.jpg",
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

  const checkPasswordStrength = (password: string) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters long");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one lowercase letter");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one number");
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one special character");
    }

    const isValid = score >= 4 && password.length >= 8;

    return { score, feedback, isValid };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordStrength.isValid) {
      toast.error("Please create a stronger password");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (
      (formData.role === "student" || formData.role === "advisor") &&
      !formData.batch
    ) {
      toast.error("Batch is required");
      return;
    }
    
    if (formData.role === "student" && !formData.studentId) {
      toast.error("Student ID is required");
      return;
    }

    setLoading(true);

    const { confirmPassword, ...submitData } = formData;
    const success = await register(submitData);
    if (success) {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "password") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "hop":
        return <Shield className="w-5 h-5" />;
      case "teacher":
        return <Users className="w-5 h-5" />;
      case "advisor":
        return <Briefcase className="w-5 h-5" />;
      case "student":
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <UserPlus className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
          
           {/* <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Join Smart HITEC
            </h2>*/}
          </div>

          <Card className="shadow-2xl border-0 bg-white backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        required
                        className="pl-9 border-2 border-gray-200 focus:border-indigo-500 transition-colors rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        required
                        className="pl-9 border-2 border-gray-200 focus:border-indigo-500 transition-colors rounded-lg"
                      />
                    </div>
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="pl-10 border-2 border-gray-200 focus:border-indigo-500 transition-colors rounded-lg h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    Select Role
                  </Label>
                  <Select
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-indigo-500 h-11 rounded-lg">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium">Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advisor">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium">Batch Advisor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="font-medium">Teacher</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hop">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium">Head of Program (HOP)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.role === "student" || formData.role === "advisor") && (
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-sm font-semibold text-gray-700">
                      Batch
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="batch"
                        placeholder="e.g., SE-2023"
                        value={formData.batch}
                        onChange={(e) =>
                          handleInputChange("batch", e.target.value)
                        }
                        required
                        className="pl-10 border-2 border-gray-200 focus:border-indigo-500 transition-colors rounded-lg h-11"
                      />
                    </div>
                  </div>
                )}

                {formData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-sm font-semibold text-gray-700">
                      Student ID
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="studentId"
                        placeholder="e.g., 22-SE-015"
                        value={formData.studentId}
                        onChange={(e) =>
                          handleInputChange("studentId", e.target.value)
                        }
                        required
                        className="pl-10 border-2 border-gray-200 focus:border-indigo-500 transition-colors rounded-lg h-11"
                      />
                    </div>
                  </div>
                )}

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
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      className={`pl-10 pr-12 border-2 transition-colors rounded-lg h-11 ${
                        formData.password && !passwordStrength.isValid
                          ? "border-red-300 focus:border-red-500"
                          : formData.password && passwordStrength.isValid
                            ? "border-green-300 focus:border-green-500"
                            : "border-gray-200 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score <= 1
                                ? "bg-red-500 w-1/5"
                                : passwordStrength.score <= 2
                                  ? "bg-orange-500 w-2/5"
                                  : passwordStrength.score <= 3
                                    ? "bg-yellow-500 w-3/5"
                                    : passwordStrength.score <= 4
                                      ? "bg-blue-500 w-4/5"
                                      : "bg-green-500 w-full"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            passwordStrength.score <= 1
                              ? "text-red-500"
                              : passwordStrength.score <= 2
                                ? "text-orange-500"
                                : passwordStrength.score <= 3
                                  ? "text-yellow-500"
                                  : passwordStrength.score <= 4
                                    ? "text-blue-500"
                                    : "text-green-500"
                          }`}
                        >
                          {passwordStrength.score <= 1
                            ? "Weak"
                            : passwordStrength.score <= 2
                              ? "Fair"
                              : passwordStrength.score <= 3
                                ? "Good"
                                : passwordStrength.score <= 4
                                  ? "Strong"
                                  : "Excellent"}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="font-semibold text-red-900 mb-1">Password must have:</p>
                          <ul className="space-y-1">
                            {passwordStrength.feedback.map((item, index) => (
                              <li key={index} className="flex items-center text-red-700">
                                <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                      className={`pl-10 pr-12 border-2 transition-colors rounded-lg h-11 ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-300 focus:border-red-500"
                          : formData.confirmPassword &&
                              formData.password === formData.confirmPassword
                            ? "border-green-300 focus:border-green-500"
                            : "border-gray-200 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-600 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        Passwords do not match
                      </p>
                    )}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword &&
                    formData.password && (
                      <p className="text-xs text-green-600 flex items-center font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Passwords match perfectly
                      </p>
                    )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={
                    loading ||
                    !passwordStrength.isValid ||
                    formData.password !== formData.confirmPassword ||
                    !formData.password ||
                    !formData.confirmPassword
                  }
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    getRoleIcon(formData.role)
                  )}
                  <span className="ml-2">Create Account</span>
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                  >
                    Already have an account? <span className="font-semibold">Sign in</span>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero Section with Auto-Rotating Images */}
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
            <h1 className="text-4xl font-bold mb-4">Start Your Journey</h1>
            <p className="text-xl mb-8 text-purple-100">
              Join HITEC University's advanced batch advisory platform for streamlined academic management
            </p>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  For Students
                </h3>
                <p className="text-sm text-purple-100">
                  Submit applications, track requests, and communicate seamlessly
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  For Batch Advisors
                </h3>
                <p className="text-sm text-purple-100">
                  Manage requests and coordinate with faculty efficiently
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  For Teachers
                </h3>
                <p className="text-sm text-purple-100">
                  Track progress and collaborate with advisors
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  For HOP
                </h3>
                <p className="text-sm text-purple-100">
                  Oversee with comprehensive analytics and approvals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            className="w-full h-auto text-purple-500/20 rotate-180"
            fill="currentColor"
          >
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}