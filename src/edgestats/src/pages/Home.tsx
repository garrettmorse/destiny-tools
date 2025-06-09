import Stats from "../components/Stats";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen place-items-center justify-top py-16">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">
        Edgestats
      </h1>
      <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl text-center">
        Preview the Edge of Fate armor stats
      </p>
      <Stats />
    </div>
  );
};

export default HomePage;
