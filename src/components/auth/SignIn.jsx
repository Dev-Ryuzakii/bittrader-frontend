import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import BG from '../../assets/BG.png';
import FormField from '../UI/FormField';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext.jsx';

const SignIn = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!formData.email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) validationErrors.password = 'Password is required';

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        // Call the API to authenticate
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        // Extract token and user data from response
        const { access_token, user } = response;
        
        // Update auth context with user data and token
        await login(user, access_token);
        
        // Navigate to intended page
        navigate(from, { replace: true });
      } catch (error) {
        //console.error('Login Error:', error);
        let errorMessage = 'Invalid credentials or server error!';
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setErrors({
          api: errorMessage,
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
      <div className="relative z-10 w-full max-w-md border-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl text-white font-bold tracking-wide">Tradexas</h1>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit}>
          {errors.api && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{errors.api}</span>
            </div>
          )}
          {/* Email */}
          <FormField
            label="Email"
            name="email"
            type="text"
            placeholder="Email"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

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

          {/* Forgot Password */}
          <div className="flex justify-end mt-1">
            <a href="#" className="text-sm text-purple-400 hover:text-purple-600">
              Forgot Password?
            </a>
          </div>

          {/* Remember Me */}
          <div className="flex items-center my-4">
            <input type="checkbox" className="mr-2" />
            <label className="text-gray-300">Remember Me</label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold mb-4 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-gray-400 text-sm mb-4">
          Don’t have an account?{' '}
          <Link
            to="/signup"
            className="text-blue-400 underline hover:text-blue-600"
          >
            Sign Up
          </Link>
        </p>

        {/* Social login */}
        <p className="text-center text-gray-500 mb-2">- OR -</p>
        <div className="flex justify-between gap-2">
          <button className="flex-1 py-2 bg-[#222222] text-white rounded-lg hover:bg-gray-600">
            Google
          </button>
          <button className="flex-1 py-2 bg-[#222222] text-white rounded-lg hover:bg-gray-600">
            Discord
          </button>
          <button className="flex-1 py-2 bg-[#222222] text-white rounded-lg hover:bg-gray-600">
            Apple
          </button>
          <button className="flex-1 py-2 bg-[#222222] text-white rounded-lg hover:bg-gray-600">
            Telegram
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
