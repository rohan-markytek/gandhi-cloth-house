import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ViewProducts() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name', 'quantity-high', 'quantity-low'
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;
  const uc = searchParams.get("uc");

  // Load products from API
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let data = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(lower));
    }

    // Sort
    if (sortBy === "name") {
      data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "quantity-high") {
      data.sort((a, b) => b.quantity - a.quantity);
    } else if (sortBy === "quantity-low") {
      data.sort((a, b) => a.quantity - b.quantity);
    }

    return data;
  }, [products, searchTerm, sortBy]);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const outOfStock = products.filter(p => p.quantity === 0).length;

  // Render product in list view
  const renderListView = (p) => {
    const isLowStock = p.quantity > 0 && p.quantity <= 10;
    const isOutOfStock = p.quantity === 0;

    return (
      <div
        key={p.id}
        className={`
          relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm
          ${isOutOfStock ? "bg-gray-50 border-gray-200 opacity-75" : "bg-white border-gray-100"}
        `}
      >
        <div className="p-3 flex items-center gap-3">
          {/* Image */}
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 border border-gray-100">
            {p.picture ? (
              <img
                src={`${imageBaseUrl}${p.picture}`}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${isOutOfStock ? "bg-red-100 text-red-700" : isLowStock ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
              `}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {isOutOfStock ? "Out of Stock" : `${p.quantity} in stock`}
              </div>
            </div>
          </div>

          {/* Quantity Badge */}
          <div className="flex-shrink-0 text-right">
            <div className={`
              text-2xl font-bold
              ${isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-600" : "text-gray-900"}
            `}>
              {p.quantity}
            </div>
            <div className="text-xs text-gray-400">units</div>
          </div>
        </div>

        {/* Stock indicator bar */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
            <div
              className={`h-full transition-all ${isLowStock ? "bg-yellow-400" : "bg-green-400"}`}
              style={{ width: `${Math.min((p.quantity / 100) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // Render product in grid view
  const renderGridView = (p) => {
    const isLowStock = p.quantity > 0 && p.quantity <= 10;
    const isOutOfStock = p.quantity === 0;

    return (
      <div
        key={p.id}
        className={`
          relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md
          ${isOutOfStock ? "bg-gray-50 border-gray-200 opacity-75" : "bg-white border-gray-100"}
        `}
      >
        {/* Image */}
        <div className="aspect-square w-full overflow-hidden bg-gray-200">
          {p.picture ? (
            <img
              src={`${imageBaseUrl}${p.picture}`}
              alt={p.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>

          <div className="flex items-center justify-between">
            <div className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
              ${isOutOfStock ? "bg-red-100 text-red-700" : isLowStock ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
            `}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              {isOutOfStock ? "Out" : p.quantity}
            </div>

            <div className={`
              text-2xl font-bold
              ${isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-600" : "text-gray-900"}
            `}>
              {p.quantity}
            </div>
          </div>
        </div>

        {/* Stock indicator bar */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
            <div
              className={`h-full transition-all ${isLowStock ? "bg-yellow-400" : "bg-green-400"}`}
              style={{ width: `${Math.min((p.quantity / 100) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/?uc=${uc}`)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">View Products</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={loadProducts}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSortBy("name")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${sortBy === "name" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortBy("quantity-high")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${sortBy === "quantity-high" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Stock: High to Low
          </button>
          <button
            onClick={() => setSortBy("quantity-low")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${sortBy === "quantity-low" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Stock: Low to High
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Products</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{totalStock}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Stock</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-red-500">{outOfStock}</div>
          <div className="text-xs text-gray-500 mt-0.5">Out of Stock</div>
        </div>
      </div>

      {/* Product List/Grid */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-3">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 mt-3">No products found.</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {filteredProducts.map((p) =>
              viewMode === "grid" ? renderGridView(p) : renderListView(p)
            )}
          </div>
        )}
      </div>

    </div>
  );
}
