import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import BG from '../../assets/BG.png'; // Background image
import FormField from '../UI/FormField';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '', // added email to state
    password: '',
  });

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
    try {
      const response = await api.post('/auth/login', formData);
      console.log('Login Success:', response.data);
      // Save token to localStorage or redirect user
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      setErrors({
        api: error.response?.data?.message || 'Invalid credentials or server error!',
      });
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
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl text-white font-bold tracking-wide">Bitetrader</h1>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit}>
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
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 mb-4"
          >
            Sign In
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
          <button className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            Google
          </button>
          <button className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            Discord
          </button>
          <button className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            Apple
          </button>
          <button className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            Telegram
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
