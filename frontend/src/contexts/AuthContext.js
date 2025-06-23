import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Get the backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // ✅ FIXED: Use full backend URL instead of relative URL
      const response = await axios.post(`${BACKEND_URL}/api/login`, {
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state
      setUser(userData);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (username, email, password) => {
    try {
      // ✅ FIXED: Use full backend URL instead of relative URL
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        username,
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state
      setUser(userData);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear user state
    setUser(null);
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    getToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};















// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const userData = localStorage.getItem('user');
    
//     if (token && userData) {
//       try {
//         setUser(JSON.parse(userData));
//         // Set default authorization header
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       } catch (error) {
//         console.error('Error parsing user data:', error);
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//       }
//     }
    
//     setLoading(false);
//   }, []);

//   const login = async (email, password) => {
//     try {
//       const response = await axios.post('/api/login', {
//         email,
//         password
//       });

//       const { token, user: userData } = response.data;
      
//       // Store in localStorage
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(userData));
      
//       // Set user state
//       setUser(userData);
      
//       // Set default authorization header
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
//       return { success: true, message: response.data.message };
//     } catch (error) {
//       const message = error.response?.data?.message || 'Login failed';
//       return { success: false, message };
//     }
//   };

//   const register = async (username, email, password) => {
//     try {
//       const response = await axios.post('/api/register', {
//         username,
//         email,
//         password
//       });

//       const { token, user: userData } = response.data;
      
//       // Store in localStorage
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(userData));
      
//       // Set user state
//       setUser(userData);
      
//       // Set default authorization header
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
//       return { success: true, message: response.data.message };
//     } catch (error) {
//       const message = error.response?.data?.message || 'Registration failed';
//       return { success: false, message };
//     }
//   };

//   const logout = () => {
//     // Clear localStorage
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
    
//     // Clear user state
//     setUser(null);
    
//     // Remove authorization header
//     delete axios.defaults.headers.common['Authorization'];
//   };

//   const getToken = () => {
//     return localStorage.getItem('token');
//   };

//   const value = {
//     user,
//     login,
//     register,
//     logout,
//     getToken,
//     loading
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };



