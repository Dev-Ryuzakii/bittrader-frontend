import React, { useState } from 'react';
import FormField from '../UI/FormField';
import { User, Mail, Lock, Apple } from 'lucide-react';
import BG from '../../assets/BG.png'; 
import { Link } from 'react-router-dom';
import { authAPI } from '../../api/api';
import { auth } from '../../utils/auth';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [success, setSuccess] = useState('');

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
const MAX_RETRIES = 2;

const attemptSignup = async (retryCount = 0) => {
  try {
    const response = await authAPI.signup({
      email: formData.email.trim(),
      password: formData.password.trim()
    });
    
    // If the response includes a token, store it
    if (response.access_token) {
      auth.setAuthToken(response.access_token);
    }
    
    return { success: true, response };
  } catch (error) {
    if (
      retryCount < MAX_RETRIES &&
      error.response?.status === 500 &&
      error.response?.data?.detail?.includes('Unable to connect to authentication service')
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return attemptSignup(retryCount + 1);
    }
    return { success: false, error };
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const validationErrors = {};
  if (!formData.email.trim()) {
    validationErrors.email = 'Email is required';
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
    validationErrors.email = 'Please enter a valid email address';
  }
  if (!formData.password.trim()) {
    validationErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    validationErrors.password = 'Password must be at least 6 characters long';
  }

  setErrors(validationErrors);

  if (Object.keys(validationErrors).length === 0) {
    setIsSubmitting(true);
    setErrors({});

    try {
      const { success, response: signupResponse, error } = await attemptSignup();

      if (!success) {
        let errorMessage = 'An error occurred while connecting to the server';

        if (error.response) {
          if (error.response.status === 422) {
            // Validation errors from FastAPI
            errorMessage = error.response.data.detail;
          } else if (error.response.status === 400) {
            // Bad request errors (e.g., invalid credentials)
            errorMessage = error.response.data.detail;
          } else if (error.response.status === 500) {
            // Server errors
            errorMessage = error.response.data.detail || 'An unexpected error occurred. Please try again later.';
          } else {
            errorMessage = error.response.data.detail || 'An error occurred during signup';
          }
        }
        
        setErrors({
          api: errorMessage,
        });
        return;
      }

      // Successfully signed up
      setSuccess('Successfully signed up!');
      
      // If we got a token in the response, we're already logged in
      if (signupResponse.access_token) {
        auth.redirectToDashboard();
      } else {
        // If no token, redirect to login to get one
        auth.redirectToLogin();
      }
    } catch (error) {
      setErrors({
        api: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
};

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center flex justify-center items-center relative px-2 sm:px-0"
      style={{
        backgroundImage: `url(${BG})`,
      }}
    >
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-transparent md:bg-none">
        {/* Left Column - Image with text */}
        <div className="hidden md:block relative rounded-xl overflow-hidden shadow-lg h-full">
          <img
            src={BG}
            alt="Left Banner"
            className="w-full h-full object-cover rounded-xl min-h-[300px] md:min-h-[400px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome Back!</h2>
            <p className="text-gray-300 text-base md:text-lg">Join us and start your journey today.</p>
          </div>
        </div>

        {/* Right Column - Form with glassmorphism */}
        <div className="backdrop-blur-lg border-white/10 border border-white/20 rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-md mx-auto">
          <h2 className="text-center text-white text-xl md:text-2xl font-semibold mb-5">
            Register with:
          </h2>

          {/* Social Buttons */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3 sm:gap-3">
            <button className="flex-1 mx-0 sm:mx-1 py-2.5 border-white/10 hover:border-white/20 text-white rounded-lg transition-all duration-200 mb-2 sm:mb-0 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
              </svg>
              Google
            </button>
            <button className="flex-1 mx-0 sm:mx-1 py-2.5 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white rounded-lg transition-all duration-200 mb-2 sm:mb-0 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="#5865F2"/>
              </svg>
              Discord
            </button>
            <button className="flex-1 mx-0 sm:mx-1 py-2.5 bg-black/30 hover:bg-black/40 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-md">
              <Apple className="w-5 h-5 mr-2" />
              Apple
            </button>
          </div>

          <p className="text-center text-gray-300 mb-4">Or</p>

          <form onSubmit={handleSubmit}>
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            {errors.api && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">{errors.api}</span>
              </div>
            )}

            {/* First & Last Name side by side on md+, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="firstName"
                type="text"
                placeholder="First Name"
                icon={User}
                value={formData.firstName}
                onChange={handleChange}
              />
              <FormField
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Last Name"
                icon={User}
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}

            {/* Username */}
            <FormField
              label="Username"
              name="username"
              type="text"
              placeholder="Username"
              icon={User}
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mb-1">{errors.username}</p>
            )}

            {/* Email */}
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="Email"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mb-1">{errors.email}</p>
            )}

            {/* Password */}
            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="Password"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mb-1">{errors.password}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up...
                </div>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Bottom Links */}
          <p className="text-center text-gray-300 mt-4 text-sm">
            By creating an account, you agree to the{' '}
            <span className="text-blue-400 underline cursor-pointer">
              Terms of Service
            </span>.
          </p>
          <p className="text-center text-gray-300 mt-2 text-sm">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-blue-400 underline hover:text-blue-600"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
