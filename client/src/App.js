import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import NGOSignup from './components/NGOSignup';
import BuyerSignup from './components/BuyerSignup';
import AuditorSignup from './components/AuditorSignup';
import Login from './components/Login';
import NGODashboard from './components/NGODashboard/NGODashboard';
import BuyerDashboard from './components/BuyerDashboard';
import AuditorDashboard from './components/AuditorDashboard'
import TestPage from './components/testPage';
import CreditDetails from './components/CreditDetails'
import Profile from './components/Profile'
import { getHealth } from "./api/api"
import Home from './components/Home';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CCProvider } from './context/SmartContractConnector';
import { jwtDecode } from "jwt-decode";
import { SiRender } from "react-icons/si";




const App = () => {
  const [user, setUser] = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setUser(userData);
    // Store user data in localStorage for mock token system
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  //checkbackend function sends req to health check route
  useEffect(() => {
    const checkbackend = async () => {
      try {
        const res = await getHealth();
        if (res.status === 200) {
          console.log("Backend is ready:", res.data);
          setBackendReady(true);
        }
        else {
          console.log("Backend not ready, retrying...");
          setTimeout(checkbackend, 2000);
        }
      } catch (error) {
        console.error("Backend health check failed:", error);
        setTimeout(checkbackend, 2000);
      }
    };
    checkbackend();
  }, []);

  useEffect(() => {
    document.title = "Green Hydrogen Credit Ecosystem";
    const token = localStorage.getItem('token');

    if (token) {
      console.log("token found!")
      try {
        // For mock tokens, we'll use a simple approach
        if (token === 'mock_jwt_token_12345') {
          // This is a mock token, get user info from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Handle redirects for authenticated users
            const currentPath = window.location.pathname;
            const publicPaths = ['/', '/login', '/home', '/loading'];
            
            if (publicPaths.includes(currentPath)) {
              const dashboardPath = 
                userData.role === 'NGO' ? '/NGO-dashboard' : 
                userData.role === 'auditor' ? '/auditor-dashboard' : 
                '/buyer-dashboard';
              
              navigate(dashboardPath, { replace: true });
            }
          }
        } else {
          // Handle real JWT tokens if needed in the future
          const decodedToken = jwtDecode(token);
          const parsedSub = JSON.parse(decodedToken.sub);
          const isExpired = decodedToken.exp * 1000 < Date.now();
          console.log(decodedToken);
          if (!isExpired) {
            console.log('token is alive');
            setUser({
              username: parsedSub.username,
              role: parsedSub.role,
              id: parsedSub.id
            });
            
            // Handle redirects for authenticated users
            const currentPath = window.location.pathname;
            const publicPaths = ['/', '/login', '/home', '/loading'];
            
            if (publicPaths.includes(currentPath)) {
              const dashboardPath = 
                parsedSub.role === 'NGO' ? '/NGO-dashboard' : 
                parsedSub.role === 'auditor' ? '/auditor-dashboard' : 
                '/buyer-dashboard';
              
              navigate(dashboardPath, { replace: true });
            }
          }
          else {
            console.log('token expired');
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error("Token failure:", error);
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!backendReady) {
      navigate('/loading');
    } else {
      if (window.location.pathname === '/loading') {
        navigate('/home')
      }
    }
  }, [backendReady, navigate])

  //inline component
  const LoadingScreen = () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <div>
        <SiRender />
      </div>
      Render is restarting the service...
    </div>
  );

  return (
    <CCProvider>
      {/* <Router> */}
      <div >
        <Navbar user={user} onLogout={handleLogout} />
        <div >
          <Routes>
            <Route path='/loading' element={<LoadingScreen />} />
            <Route path="/home" element={<Home />} />
            <Route path="/NGO-signup" element={<NGOSignup onLogin={handleLogin} />} />
            <Route path="/buyer-signup" element={<BuyerSignup onLogin={handleLogin} />} />
            <Route path="/auditor-signup" element={<AuditorSignup onLogin={handleLogin} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/credits/:creditId" element={<CreditDetails />} />
            <Route path="/profile" element={
              user ? <Profile /> : <Navigate to="/login" replace />
            } />
            <Route
              path="/NGO-dashboard"
              element={
                user && user.role === 'NGO' ?
                  <NGODashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/buyer-dashboard"
              element={
                user && user.role === 'buyer' ?
                  <BuyerDashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/auditor-dashboard"
              element={
                user && user.role === 'auditor' ?
                  <AuditorDashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route path="/" element={
              user ?
                user.role === 'NGO' ? <Navigate to="/NGO-dashboard" replace /> : user.role === 'auditor' ? <Navigate to="/auditor-dashboard" /> : <Navigate to="/buyer-dashboard" replace />

                : <Navigate to="/home" replace />}
            />
          </Routes>;
        </div>
        <SpeedInsights />
      </div>
      {/* </Router> */}
    </CCProvider>
  );
};

export default App;
