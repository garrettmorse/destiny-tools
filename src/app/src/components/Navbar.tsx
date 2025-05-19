import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useNavigate } from 'react-router-dom';
import icon from '../../public/clean.svg';
  

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
    navigate(`${global.BASE_PATH}/player/${query}`);
  };

  if (window.location.pathname === '/') return <></>;
  return (
    <header className="top-0 border-b">
      <div className="flex h-14">
        <div className="flex-initial pe-4 justify-between">
          <Link to="/" className="flex items-center">
            <img src={icon} width={50} height={50} />
            <span className="hidden font-bold sm:inline-block text-xl">Raidlytics</span>
          </Link>
        </div>
        <div className="flex-auto px-8 pointer-events-none place-content-center mx-auto relative hover:bg-black dark:hover:bg-white transition-colors duration-200">
          <SearchBar onSearch={handleSearch} placeholder="Search for another Guardian..." />
        </div>
        <div className="invisible ps-4 flex-initial justify-between">
          <Link to="/" className="flex items-center">
            <img src={icon} width={50} height={50} />
            <span className="hidden font-bold sm:inline-block text-xl">Raidlytics</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;