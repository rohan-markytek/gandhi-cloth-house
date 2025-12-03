import React, { useEffect,useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const user = searchParams.get("uc");
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("uc"); 
    if (!code || code.trim() === "" || code=='null') {
      navigate("/404");
      return;
    }
  }, []);

  return (
    <header className="w-full bg-white shadow-md py-4 px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      <h1 className="text-xl font-semibold text-gray-800">Gandhi Cloth House</h1>

      {/* Desktop Menu */}
      <nav className="hidden sm:flex gap-6 text-gray-600 font-medium">
        <a href={`/?uc=${user}`} className="hover:text-gray-900">Home</a>
        <a href={`/products?uc=${user}`} className="hover:text-gray-900">Products</a>
        <a href={`/add?uc=${user}`} className="hover:text-gray-900">Add Product</a>
        <a href={`/sell?uc=${user}`} className="hover:text-gray-900">Sell Product</a>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="sm:hidden text-gray-700 focus:outline-none"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-full right-4 bg-white shadow-lg rounded-md p-4 w-40 sm:hidden">
          <a href={`/?uc=${user}`} className="block py-2 text-gray-700 hover:text-gray-900">Home</a>
          <a href={`/products?uc=${user}`} className="block py-2 text-gray-700 hover:text-gray-900">Products</a>
          <a href={`/add?uc=${user}`} className="block py-2 text-gray-700 hover:text-gray-900">Add Product</a>
          <a href={`/sell?uc=${user}`} className="block py-2 text-gray-700 hover:text-gray-900">Sell Product</a>
        </div>
      )}
    </header>
  );
}
