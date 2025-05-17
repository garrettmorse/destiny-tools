import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

interface DestinyPlayer {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  displayName: string;
  crossSaveOverride: 1 | 2 | 3 | 4;
  iconPath: string;
  isPublic: boolean;
  membershipId: string;
  membershipType:  1 | 2 | 3 | 4;
}

interface SearchResult {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  bungieNetMembershipId: string;
  destinyMemberships: DestinyPlayer[];
}

const membershipTypeLogoMap = {
  "1": "xbox.webp",
  "2": "psn.webp",
  "3": "steam.png",
  "4": "epic.webp",
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search for your Guardian..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch search results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/api/d2/searchUser?user=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        const data = (await response.json()) as SearchResult[];
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
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
    <div className="w-full max-w-md mx-auto relative" ref={searchContainerRef}>
      <form
        className="relative"
      >
        <div className="relative ">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground hover:outline-none hover:ring-1 focus:outline-none focus:ring-5 transition duration-200 focus:ring-primary"
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary/80"
          >
            Search
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
            <ul className="">
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
            <div className="p-3 text-center text-sm text-muted-foreground">
              No guardians found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
