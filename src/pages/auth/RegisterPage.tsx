import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Upload, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { extractErrorMessage, logApiError } from '../../utils/errorHandler';

interface FormErrors {
  general?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  idProof?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });

  const [idProof, setIdProof] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors: any = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!idProof) {
      newErrors.idProof = 'ID proof document is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', JSON.stringify(formData.address));
      if (idProof) {
        formDataToSend.append('idProof', idProof);
      }

      const response = await authAPI.register(formDataToSend);
      const { user, token } = response.data.data;

      setAuth(user, token);
      navigate('/dashboard');
    } catch (error: any) {
      logApiError(error, 'User Registration');
      const { general, fieldErrors } = extractErrorMessage(error);
      
      // Format field errors for nested address fields
      const formattedErrors: FormErrors = { general };
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field.startsWith('address.')) {
          const addressField = field.split('.')[1];
          if (!formattedErrors.address) {
            formattedErrors.address = {};
          }
          (formattedErrors.address as any)[addressField] = message;
        } else {
          (formattedErrors as any)[field] = message;
        }
      });
      
      setErrors(formattedErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-accent-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-500/10 border border-accent-500/15 mb-6">
            <Shield className="h-7 w-7 text-accent-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h2>
          <p className="text-sm text-dark-400">Join EASYBORROW to start renting and lending securely</p>
        </div>

        <div className="mt-8 glass-card py-8 px-6 sm:px-10 animate-fade-up">
          {errors.general && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{errors.general}</span>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-5 pb-2 border-b border-dark-800">Personal Information</h3>

              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="e.g. John Doe"
                  />
                  {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-dark-200 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="+91 9000000000"
                  />
                  {errors.phone && <p className="mt-2 text-xs text-red-400">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="idProof" className="block text-sm font-medium text-dark-200 mb-2">
                    ID Proof Document <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="idProof"
                      id="idProof"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setIdProof(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="idProof"
                      className={`flex items-center justify-center w-full px-4 py-3 border border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                         idProof 
                           ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                           : 'border-dark-600 bg-dark-900/50 text-dark-400 hover:border-accent-500/50 hover:text-accent-400'
                      }`}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      <span className="text-sm truncate max-w-[200px]">
                        {idProof ? idProof.name : 'Upload ID Proof'}
                      </span>
                    </label>
                  </div>
                  {errors.idProof && <p className="mt-2 text-xs text-red-400">{errors.idProof}</p>}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-5 pb-2 border-b border-dark-800">Address Details</h3>

              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address.street" className="block text-sm font-medium text-dark-200 mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    required
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Flat, House no., Building, Company, Apartment"
                    className="input-dark"
                  />
                  {errors.address?.street && <p className="mt-2 text-xs text-red-400">{errors.address.street}</p>}
                </div>

                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-dark-200 mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    required
                    value={formData.address.city}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="e.g. Mumbai"
                  />
                  {errors.address?.city && <p className="mt-2 text-xs text-red-400">{errors.address.city}</p>}
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-dark-200 mb-2">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    required
                    value={formData.address.state}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="e.g. Maharashtra"
                  />
                  {errors.address?.state && <p className="mt-2 text-xs text-red-400">{errors.address.state}</p>}
                </div>

                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-dark-200 mb-2">
                    ZIP Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    required
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="e.g. 400001"
                  />
                  {errors.address?.zipCode && <p className="mt-2 text-xs text-red-400">{errors.address.zipCode}</p>}
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-5 pb-2 border-b border-dark-800">Security</h3>

              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className="input-dark pr-12"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-dark-400 hover:text-accent-400 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-200 mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="input-dark pr-12"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-dark-400 hover:text-accent-400 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-800">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-accent w-full text-base gap-2 group !py-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-dark-500 text-center leading-relaxed">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-accent-400 hover:text-accent-300 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-accent-400 hover:text-accent-300 transition-colors">
                Privacy Policy
              </Link>
            </div>
            
            <div className="mt-6 text-center text-sm text-dark-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent-400 hover:text-accent-300 transition-colors">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;