import React from "react";
import LootTracker from "../components/LootTracker";
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex-none sm:flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">
          Loot Tracker
        </h1>
        <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
          Track your loot drops with the community
        </p>
      </div>
      <LootTracker />
    </div>
  );
};

export default HomePage;
