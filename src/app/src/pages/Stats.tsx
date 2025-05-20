
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { fetchStats } from '../services/stats';
import { fetchRaids } from '../services/raids';
import UserCard from '../components/UserCard';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import RaidCard from '../components/RaidCard';
import Fireteam from '../components/Fireteam';

const Stats: React.FC = () => {
  const { userId = '' } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isRaidsLoading, setIsRaidsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [raids, setRaids] = useState<Raids | null>(null);
  const [selectedRaid, setSelectedRaid] = useState<string>(searchParams.get('raid') ?? '');
  const [loadingMessage, setLoadingMessage] = useState("Loading Guardian Data...")
  const [isFireteamToggled, setIsFireteamToggled] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const interval1Ref = useRef<NodeJS.Timeout | null>(null);
  const interval2Ref = useRef<NodeJS.Timeout | null>(null);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    const _fetchRaids = async () => {
      setIsRaidsLoading(true);
      const [raidsError, raidsData] = await fetchRaids();
      if (raidsError) {
        setIsError(true);
      } else {
        setRaids(raidsData);
      }
      setIsRaidsLoading(false);
    }
    _fetchRaids();
  }, [])

  useEffect(() => {
    const _fetchStats = async () => {
      if (!raids) {
        return;
      }
      if (!selectedRaid) {
        setStats(null);
        return;
      }
      
      const [statsError, statsData] = await fetchStats(userId, raids[selectedRaid].ids);
      if (statsError) {
        setStats(null);
      } else {
        setStats(statsData);
      }
      setIsStatsLoading(false);
    }
    if (selectedRaid) {
      setIsStatsLoading(true);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (selectedRaid) {
        _fetchStats();
      } else {
        setStats(null);
      }
    }, 207);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedRaid, raids, userId]);

  useEffect(() => {
    if (!isStatsLoading) {
      return;
    }
    if (interval1Ref.current) {
      clearInterval(interval1Ref.current);
    }
    if (interval2Ref.current) {
      clearInterval(interval2Ref.current);
    }
    interval1Ref.current = setInterval(() => {
      setLoadingMessage("Still Loading Guardian Data...")
    }, 5000);
    interval2Ref.current = setInterval(() => {
      setLoadingMessage("Yep, Still Loading Guardian Data...") }, 10000);
    return () => {
      setLoadingMessage("Loading Guardian Data...");
      if (interval1Ref.current) clearInterval(interval1Ref.current);
      if (interval2Ref.current) clearInterval(interval2Ref.current);
    }
  }, [isStatsLoading])

  const handleRaidSelect = (raidName: string) => {
    setSelectedRaid(raidName);
    setSearchParams({ raid: raidName });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="overflow-hidden place-items-center py-6">
        {isError ? <div>something went wrong. try again later.</div> : (
          <>
          <div className="container flex min-h-20 overflow-x-auto [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700
            dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {isRaidsLoading ? (
            <Loading message="Loading Raids..."/>
          ) : Object.entries(raids ?? {}).map(([raidName, data]) => (
            <div className="flex mx-1 min-w-25 cursor-pointer place-items-center" onClick={() => handleRaidSelect(raidName)} key={raidName}>
              <RaidCard isActive={selectedRaid === raidName} raid={raidName} splash={data.imgUrl} />
            </div>
            )
          )}
          </div>
          {isStatsLoading ? (
            <Loading message={loadingMessage}/>
          ) : stats ? (
            <div className="place-items-center">
              <p className="text-gray-200 mt-2">Activity Period: {stats.fireteam.periodRange}</p>
              <div className="place-items-center">
                <label className="inline-flex place-items-center p-2 col-span-2 rounded-md cursor-pointer dark:text-gray-100">
                  <input type="checkbox" onChange={(e) => setIsFireteamToggled(e.target.checked)} defaultChecked={isFireteamToggled} className="hidden peer" />
                  <span className="px-4 py-2 rounded-l-md hover:ring-1 bg-violet-200 dark:bg-violet-600 peer-checked:bg-gray-300 peer-checked:dark:bg-gray-700">{stats.user.name}</span>
                  <span className="px-4 py-2 rounded-r-md hover:ring-1 bg-gray-300 dark:bg-gray-700 peer-checked:bg-violet-200 peer-checked:dark:bg-violet-600">Their Fireteam</span>
                </label>
                {isFireteamToggled ? <Fireteam {...stats} /> : <UserCard {...stats} /> }
              </div>
            </div>
          ) : selectedRaid ? (
          <div className="text-center py-12">
            <h2 className="px-2 text-2xl font-bold mb-2">No {selectedRaid} Clears Found</h2>
            <p className="px-4">
              We couldn't find any raid stats for this Guardian.
            </p>
          </div>
          ) : (
            <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Select a Raid</h2>
            <p className="px-4">
              Selecting a Raid will generate a report based on the latest successful clear.
            </p>
          </div>
        )}
        </>)}
        {/* Raids */}
        
    </div>
    </div>
  );
};

export default Stats;