import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { fetchUser } from '../services/user';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}
const membershipTypeLogoMap = {
  "1": "../xbox.webp",
  "2": "../psn.webp",
  "3": "../steam.png",
  "4": "../epic.webp",
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search for your Guardian..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch search results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      const [searchError, searchData] = await fetchUser(query);
      if (searchError) {
        setResults([]);
      } else {
        setResults(searchData);
        setShowResults(true);
      }
      setIsLoading(false);
    };

    const debounceTimeout = setTimeout(() => {
      if (query) {
        fetchResults();
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleResultClick = (membershipId: string) => {
    onSearch(membershipId);
    setShowResults(false);
  };

  return (
    <div className="w-full z-100 max-w-md bg-white dark:bg-gray-800 mx-auto relative">
      <form
        className="relative"
      >
        <div className="relative ">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pointer-events-auto w-full pl-10 pr-4 py-3 bg-secondary border rounded-lg text-foreground hover:outline-none hover:ring-4 focus:outline-none focus:ring-4 transition-colors duration-200"
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary/80"
          >
          </button>
        </div>
      </form>

      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-md">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : results.length > 0 ? (
            <ul className="bg-white dark:bg-gray-800 pointer-events-auto">
              {results.map((result) => { 
                const destinyMembership = result.destinyMemberships[0];
                return (
                <li 
                  key={destinyMembership.membershipId}
                  className="px-4 py-2 dark:hover:text-black hover:bg-gray-200 hover:text-blue-600 cursor-pointer text-md"
                  onClick={() => handleResultClick(destinyMembership.membershipId)}
                >
                  <img style={{ float: 'left', }}src={membershipTypeLogoMap[destinyMembership.membershipType]} width={25} height={25} />
                  &nbsp;{result.bungieGlobalDisplayName}#{result.bungieGlobalDisplayNameCode}
                </li>
              ) })}
            </ul>
          ) : query.length >= 2 ? (
            <div className="bg-white dark:bg-gray-800 p-3 text-center text-sm">
              No guardians found. Try updating your search.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
