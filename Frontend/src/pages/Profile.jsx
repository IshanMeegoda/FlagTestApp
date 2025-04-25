import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { StarIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

const Profile = () => {
  const { currentUser, favorites, removeFavorite } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRemoveFavorite = async (countryCode) => {
    try {
      await removeFavorite(countryCode);
    } catch (err) {
      setError('Failed to remove country from favorites');
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="md:col-span-2">
          <p className="text-darkGray dark:text-gray-400">Email</p>
          <p className="font-medium">{currentUser?.email}</p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Favorite Countries</h2>
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-lg font-medium">{favorites.length} countries</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkBlue dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : favorites.length === 0 ? (
          <div className="card p-6 text-center">
            <p>You haven't added any countries to your favorites yet.</p>
            <p className="mt-2 text-darkGray dark:text-gray-400">
              Explore countries and add them to your favorites by clicking the star icon!
            </p>
            <Link to="/" className="mt-4 button inline-block">
              Explore Countries
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favorites.map(country => (
              <div key={country.code} className="card overflow-hidden relative">
                <Link to={`/country/${country.name}`}>
                  <img
                    src={country.flag}
                    alt={`Flag of ${country.name}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold">{country.name}</h3>
                    <p className="text-sm text-darkGray dark:text-gray-400">
                      {country.region}
                    </p>
                  </div>
                </Link>
                <button 
                  onClick={() => handleRemoveFavorite(country.code)}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-darkBlue rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <StarIcon className="h-5 w-5 text-yellow-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
