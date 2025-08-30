import React, { useState } from 'react';
import { signup, login } from '../api/api';
// import { Turnstile } from '@marsidev/react-turnstile'; // Commented out for simplified testing
import { useNavigate } from 'react-router-dom';


const BuyerSignup = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  // const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null)
  const [color, setColor] = useState(null)
  const [loadStatus, setLoadStatus] = useState(false);
  const navigate = useNavigate();
  // const SITE_KEY = process.env.REACT_APP_SITE_KEY || '1x00000000000000000000AA';
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Signing up Buyer with:", formData);
      setLoadStatus(true);
      const signupResponse = await signup({ ...formData, role: 'buyer' });

      console.log("Signup response:", signupResponse.data);
      setStatus(signupResponse.data.message)
      setColor('bg-indigo-700')
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setStatus(null)
        setColor(null)
      }, 3000);
      
      // Now log in with the new account
      console.log("Attempting to log in with new account");
      const loginResponse = await login({ ...formData, role: 'buyer' });
      console.log("Login response:", loginResponse.data);

      localStorage.setItem("token", loginResponse.data.token);
      onLogin({ username: formData.username, role: 'buyer', id: loginResponse.data.user.id });

      // Redirect to dashboard
      console.log("Redirecting to buyer dashboard");
      navigate('/buyer-dashboard');
    } catch (error) {
      setLoadStatus(false);
      console.error('Signup/Login failed:', error);
      
      if (error.response) {
        if (error.response.status === 409) {
          setStatus('Username or email already exists')
        } else if (error.response.status === 400) {
          setStatus(error.response.data.message || 'Missing required information')
        } else {
          setStatus('Signup Failed. Please Try Again')
        }
      } else {
        setStatus('Network error. Please check your connection.')
      }
      
      setColor('bg-red-500')
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setStatus(null)
        setColor(null)
      }, 3000);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 w-full min-h-screen bg-gradient-to-br from-indigo-500 to-blue-400">

      {status && (
        <div className={`flex fixed top-15 left-1/2 items-center py-2 px-4 text-white ${color} rounded-lg shadow-lg transition-transform duration-300 transform -translate-x-1/2 animate-slideIn}`} >
          <span>{status}</span>
        </div>
      )
      }
      <div className="w-full max-w-md rounded-xl shadow-xl bg-white/90 backdrop-blur-sm">
        <div className="p-8">
          <div className="mb-1 text-sm font-semibold tracking-wide text-blue-700 uppercase">Buyer Registration</div>
          <h2 className="block mt-1 text-2xl font-medium leading-tight text-blue-900">Create a buyer account</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-blue-800" htmlFor="username">
                Username
              </label>
              <input
                className="py-2 px-3 w-full rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/50"
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-blue-800" htmlFor="email">
                Email
              </label>
              <input
                className="py-2 px-3 w-full rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/50"
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-blue-800" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="py-2 px-3 w-full rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/50"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="flex absolute inset-y-0 right-3 items-center text-blue-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {/* Captcha removed for easier testing */}
            <div>
              <button
                className="py-2 px-4 w-full font-semibold text-white bg-blue-600 rounded-lg transition-colors duration-300 hover:bg-blue-700"
                type="submit"
              >
                {loadStatus ? "Loading..." : "Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuyerSignup;
