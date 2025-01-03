import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-9xl font-extrabold text-white tracking-widest">
          404
        </h1>
        <button className="mt-5" onClick={() => navigate("/")}>
          <span className="relative inline-block text-sm font-medium text-white group active:text-opacity-75">
            <span className="absolute inset-0 transition-transform translate-x-0.5 translate-y-0.5 bg-white opacity-[0.1] group-hover:translate-y-0 group-hover:translate-x-0"></span>
            <span className="relative block px-8 py-3 bg-black border border-current">
              Go Home
            </span>
          </span>
        </button>
        <p className="text-white text-xl font-medium mt-8">
          Oops! The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
