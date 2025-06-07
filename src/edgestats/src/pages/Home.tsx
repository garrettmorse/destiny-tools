
import React, { useState, useEffect } from 'react';
import { fetchMods } from '../services/mods';
import Stats from '../components/Stats';
import Loading from '../components/Loading';
import type { Mods } from '../services/services';

const HomePage: React.FC = () => {
  const [isModsLoading, setIsModsLoading] = useState(false);
  const [mods, setMods] = useState<Mods | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const _fetchMods = async () => {
      setIsModsLoading(true);
      const [modsError, modsData] = await fetchMods();
      if (modsError) {
        setIsError(true);
      } else {
        setMods(modsData);
      }
      setIsModsLoading(false);
    }
    _fetchMods();
  }, []);
  
  return (
    <div className="min-h-screen flex-none sm:flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-top px-4 py-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">Edgestats</h1>
        <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
          Preview the Edge of Fate armor stats
        </p>
        {isError ? <div>Something went wrong. Try again later.</div> : (<>{isModsLoading ? <Loading message='Loading...' /> : <Stats mods={mods} />}</>)}
      </div>
    </div>
  );
};

export default HomePage;