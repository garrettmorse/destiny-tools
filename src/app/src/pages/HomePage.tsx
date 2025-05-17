
import React from 'react';
import SearchBar from '../components/SearchBar';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigate(`/player/${query}`);
  };

  return (
    <div className="min-h-screen flex-none sm:flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">Raidlytics</h1>
        <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
          Track your raid stats across attempts
        </p>
        <SearchBar onSearch={handleSearch} />
      </div>
    </div>
  );
};

export default HomePage;