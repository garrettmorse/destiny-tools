import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page has been lost in the Darkness
        </p>
        <Link
          /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite... */
          to={`${global.BASE_PATH}/`}
          className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded transition-colors"
        >
          Return to Orbit
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
