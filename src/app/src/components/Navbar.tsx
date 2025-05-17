import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  if (window.location.pathname === '/') return <></>;
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl">RAID_TREND</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;