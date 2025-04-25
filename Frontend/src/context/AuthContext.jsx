import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Match your backend URL
  const API_URL = 'https://flag-test-app.vercel.app';

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Use the /profile endpoint from your backend
          const response = await axios.get(`${API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Set current user based on your backend response structure
          setCurrentUser({
            email: response.data.email,
            userId: response.data.userId
          });
          
          // Fetch user favorites
          fetchFavorites(token);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);
  
  const fetchFavorites = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFavorites(response.data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      // Use the /login endpoint from your backend
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });
      
      // Store token from response
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // Set current user based on your backend response structure
      setCurrentUser({
        email: response.data.email,
        userId: response.data.userId
      });
      
      // Fetch user favorites after login
      await fetchFavorites(token);
      
      // Transfer any guest favorites to the user account
      await transferGuestFavorites(token);
      
      return response.data;
    } catch (err) {
      // Handle error based on your backend response structure
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  };
  
  const transferGuestFavorites = async (token) => {
    const guestFavorites = localStorage.getItem('guestFavorites');
    if (!guestFavorites) return;
    
    const favoritesList = JSON.parse(guestFavorites);
    if (favoritesList.length === 0) return;
    
    try {
      // For each guest favorite, add it to the user's favorites
      for (const countryCode of favoritesList) {
        // We need to fetch country details first
        const countryResponse = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const country = countryResponse.data[0];
        
        await axios.post(`${API_URL}/favorites`, {
          code: country.cca3,
          name: country.name.common,
          flag: country.flags.svg,
          region: country.region
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Clear guest favorites
      localStorage.removeItem('guestFavorites');
      
      // Refresh favorites
      await fetchFavorites(token);
    } catch (err) {
      console.error('Failed to transfer guest favorites:', err);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Use the /register endpoint from your backend
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    } catch (err) {
      // Handle error based on your backend response structure
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setFavorites([]);
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch (error) {
      return true; // If there's an error parsing the token, consider it expired
    }
  };

  // Get authenticated user's token
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      localStorage.removeItem('token');
      setCurrentUser(null);
      return null;
    }
    
    return token;
  };
  
  // Add a country to favorites
  const addFavorite = async (country) => {
    if (!currentUser) return false;
    
    try {
      const token = getToken();
      if (!token) return false;
      
      await axios.post(`${API_URL}/favorites`, {
        code: country.cca3,
        name: country.name.common,
        flag: country.flags.svg,
        region: country.region
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update favorites list
      await fetchFavorites(token);
      return true;
    } catch (err) {
      console.error('Failed to add favorite:', err);
      return false;
    }
  };
  
  // Remove a country from favorites
  const removeFavorite = async (countryCode) => {
    if (!currentUser) return false;
    
    try {
      const token = getToken();
      if (!token) return false;
      
      await axios.delete(`${API_URL}/favorites/${countryCode}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update favorites list
      await fetchFavorites(token);
      return true;
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      return false;
    }
  };
  
  // Check if a country is in favorites
  const isFavorite = (countryCode) => {
    return favorites.some(favorite => favorite.code === countryCode);
  };

  const value = {
    currentUser,
    loading,
    error,
    favorites,
    login,
    register,
    logout,
    getToken,
    addFavorite,
    removeFavorite,
    isFavorite,
    isAuthenticated: !!currentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
