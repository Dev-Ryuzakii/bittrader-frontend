import React, { useState } from 'react';
import FormField from '../UI/FormField';
import { User, Mail, Lock } from 'lucide-react';
import BG from '../../assets/BG.png'; 
import { Link } from 'react-router-dom';
import api from '../../api/api';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const validationErrors = {};
  if (!formData.firstName.trim()) validationErrors.firstName = 'First name is required';
  if (!formData.lastName.trim()) validationErrors.lastName = 'Last name is required';
  if (!formData.username.trim()) validationErrors.username = 'Username is required';
  if (!formData.email.trim()) validationErrors.email = 'Email is required';
  if (!formData.password.trim()) validationErrors.password = 'Password is required';

  setErrors(validationErrors);

  if (Object.keys(validationErrors).length === 0) {
    try {
      const response = await api.post('/auth/signup', formData);
      console.log('Signup Success:', response.data);
      // Show success message or navigate to login
    } catch (error) {
      console.error('Signup Error:', error.response?.data || error.message);
      setErrors({
        api: error.response?.data?.message || 'Something went wrong during signup!',
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
              className="w-full py-2 mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90"
            >
              Sign Up
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
