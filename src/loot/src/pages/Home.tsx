import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
  const { auth } = useAuth();

  const authBasedContent =
    auth.status === "unauthenticated" ? (
      <button
        onClick={() =>
          (window.location.href = `${global.BNET}/en/OAuth/Authorize?client_id=${global.CLIENT_ID}&response_type=code&state=777`)
        }
        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Login with Bungie
      </button>
    ) : auth.status === "authenticated" ? (
      <Link
        to={`${global.BASE_PATH}/dashboard`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Let's Go →
      </Link>
    ) : auth.status === "loading" ? (
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
        <div className="flex items-center">
          <div className="mask-conic-from-25% mask-conic-to-25% w-6 h-6 border-4 relative rounded-full transform rotate-90 animate-spin" />
          <p className="ml-1 text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    ) : (
      <div>
        Uh oh. If refreshing the page doesn't work, please try again later..
      </div>
    );

  return (
    <div className="min-h-screen flex-none sm:flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">
          Loot Tracker
        </h1>
        <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
          Track your loot drops with the community
        </p>
        {authBasedContent}
      </div>
    </div>
  );
};

export default HomePage;
