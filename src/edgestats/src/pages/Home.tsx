
import Stats from '../components/Stats';

const HomePage: React.FC = () => {

  return (
    <div className="min-h-screen flex-none sm:flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-top px-4 py-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">Edgestats</h1>
        <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
          Preview the Edge of Fate armor stats
        </p>
        <Stats />
      </div>
    </div>
  );
};

export default HomePage;