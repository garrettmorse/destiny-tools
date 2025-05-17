
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerStats } from '../services/stats';
import PlayerCard from '../components/PlayerCard';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import { useNavigate } from 'react-router-dom';

const PlayerPage: React.FC = () => {
  const { playerName = '' } = useParams<{ playerName: string }>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getPlayerStats(playerName)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching player stats:', error);
        setLoading(false);
      });
  }, [playerName]);

  const handleSearch = (query: string) => {
    navigate(`/player/${query}`);
  };

  return (
    <div>
      <Navbar />
    <div className="container py-6">
      <div className="max-w-md mx-auto mb-8">
        <SearchBar onSearch={handleSearch} placeholder="Search for another Guardian..." />
      </div>
      
      {loading ? (
        <Loading />
      ) : stats ? (
        <PlayerCard stats={stats} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Guardian Not Found</h2>
          <p className="text-muted-foreground">
            We couldn't find any raid stats for this Guardian.
          </p>
        </div>
      )}
    </div>
    </div>
  );
};

export default PlayerPage;