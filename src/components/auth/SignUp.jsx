import React, { useState } from 'react';
import FormField from '../UI/FormField';
import { User, Mail, Lock } from 'lucide-react';
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
      className="w-screen h-screen bg-cover bg-center flex justify-center items-center relative"
      style={{
        backgroundImage: `url(${BG})`,
      }}
    >
  

      <div className="relative z-10 w-4/5 max-w-6xl grid grid-cols-2 gap-8 items-center">
        {/* Left Column - Image with text */}
        <div className="relative rounded-xl overflow-hidden shadow-lg">
          <img
            src={BG}
            alt="Left Banner"
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-8">
            <h2 className="text-4xl font-bold mb-3">Welcome Back!</h2>
            <p className="text-gray-300 text-lg">Join us and start your journey today.</p>
          </div>
        </div>

        {/* Right Column - Form with glassmorphism */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl shadow-2xl p-8">
          <h2 className="text-center text-white text-2xl font-semibold mb-5">
            Register with:
          </h2>

          {/* Social Buttons */}
          <div className="flex justify-between mb-6">
            <button className="flex-1 mx-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Google
            </button>
            <button className="flex-1 mx-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Discord
            </button>
            <button className="flex-1 mx-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
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

            {/* First & Last Name side by side */}
            <div className="grid grid-cols-2 gap-4">
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
