import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { AuthContext } from '../context/AuthContext';

const CountryDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [borderCountries, setBorderCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { currentUser, isAuthenticated, favorites, addFavorite, removeFavorite } = useContext(AuthContext);
  const API_URL = 'https://flag-test-app.vercel.app';

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://restcountries.com/v3.1/name/${name}?fullText=true`);
        setCountry(response.data[0]);
        
        // Check if this country is in favorites
        if (isAuthenticated && favorites.length > 0) {
          const found = favorites.some(fav => fav.code === response.data[0].cca3);
          setIsFavorite(found);
        } else if (!isAuthenticated) {
          // Check localStorage for guest favorites
          const storedFavorites = localStorage.getItem('guestFavorites');
          if (storedFavorites) {
            const guestFavorites = JSON.parse(storedFavorites);
            setIsFavorite(guestFavorites.includes(response.data[0].cca3));
          }
        }
        
        // Fetch border countries if they exist
        if (response.data[0].borders && response.data[0].borders.length > 0) {
          const borderCodes = response.data[0].borders.join(',');
          const borderResponse = await axios.get(`https://restcountries.com/v3.1/alpha?codes=${borderCodes}`);
          setBorderCountries(borderResponse.data);
        }
      } catch (err) {
        setError('Failed to fetch country details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, [name, isAuthenticated, favorites]);

  const toggleFavorite = async () => {
    if (!country) return;
    
    if (!isAuthenticated) {
      // Handle guest favorites with localStorage
      const storedFavorites = localStorage.getItem('guestFavorites');
      let guestFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
      
      if (isFavorite) {
        guestFavorites = guestFavorites.filter(code => code !== country.cca3);
      } else {
        guestFavorites.push(country.cca3);
      }
      
      localStorage.setItem('guestFavorites', JSON.stringify(guestFavorites));
      setIsFavorite(!isFavorite);
      return;
    }
    
    // Handle authenticated user favorites
    try {
      if (isFavorite) {
        await removeFavorite(country.cca3);
      } else {
        await addFavorite(country);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="bg-red-50 dark:bg-red-900/30 p-8 rounded-lg shadow-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">{error || 'Country not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-300 shadow-md hover:shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Extract languages as an array
  const languages = country.languages ? Object.values(country.languages) : [];
  
  // Extract currencies
  const currencies = country.currencies ? Object.values(country.currencies).map(currency => currency.name) : [];
  
  // Extract native name (first one)
  const nativeName = country.name.nativeName ? 
    Object.values(country.name.nativeName)[0].common : 
    country.name.common;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
        
        <button 
          onClick={toggleFavorite}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${
            isFavorite 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
          }`}
        >
          {isFavorite ? (
            <>
              <StarSolid className="h-6 w-6 text-yellow-400" />
              <span className="font-medium">Remove from Favorites</span>
            </>
          ) : (
            <>
              <StarOutline className="h-6 w-6" />
              <span className="font-medium">Add to Favorites</span>
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
          <img
            src={country.flags.svg}
            alt={`Flag of ${country.name.common}`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">{country.name.common}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-3">
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Native Name:</span> 
                <span>{nativeName}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Population:</span> 
                <span>{country.population.toLocaleString()}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Region:</span> 
                <span>{country.region}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Sub Region:</span> 
                <span>{country.subregion || 'N/A'}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Capital:</span> 
                <span>{country.capital?.[0] || 'N/A'}</span>
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Top Level Domain:</span> 
                <span>{country.tld?.[0] || 'N/A'}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Currencies:</span> 
                <span>{currencies.length ? currencies.join(', ') : 'N/A'}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">Languages:</span> 
                <span>{languages.length ? languages.join(', ') : 'N/A'}</span>
              </p>
            </div>
          </div>
          
          {borderCountries.length > 0 && (
            <div className="pt-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Border Countries:</h2>
              <div className="flex flex-wrap gap-3">
                {borderCountries.map(border => (
                  <Link 
                    key={border.cca3}
                    to={`/country/${border.name.common}`}
                    className="px-4 py-2 bg-white dark:bg-gray-800 rounded-md shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white text-sm font-medium"
                  >
                    {border.name.common}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional country information */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
            {country.area && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{country.area.toLocaleString()} km²</p>
              </div>
            )}
            
            {country.timezones && country.timezones.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Timezone</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{country.timezones[0]}</p>
              </div>
            )}
            
            {country.continents && country.continents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Continent</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{country.continents[0]}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Map section */}
      {country.latlng && country.latlng.length === 2 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Location</h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg h-96">
            <iframe
              title={`Map of ${country.name.common}`}
              width="100%"
              height="100%"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${country.latlng[1]-10},${country.latlng[0]-10},${country.latlng[1]+10},${country.latlng[0]+10}&layer=mapnik&marker=${country.latlng[0]},${country.latlng[1]}`}
              style={{ border: 0 }}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryDetail;
