import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const Header = ({ darkMode, toggleDarkMode }) => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header className="bg-white dark:bg-darkBlue shadow-md py-6">
      <div className="container flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Where in the world?</Link>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleDarkMode}
            className="flex items-center space-x-2"
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <button 
                onClick={logout}
                className="hover:underline"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link to="/register" className="hover:underline">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
