import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSellCart, setSellCart, clearSellCart } from "../utils/sellCart";

export default function SellProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [uc, setUc] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);
  const [sellItems, setSellItems] = useState(() => getSellCart());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("az");
  const [viewMode, setViewMode] = useState("grid");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let code = searchParams.get("uc");
    
    // If no code in URL, try localStorage
    if (!code || code.trim() === "" || code === "null") {
      code = localStorage.getItem("userCode");
    }
    
    if (!code || code.trim() === "" || code === "null") {
      navigate("/404");
      return;
    }
    
    // Save to localStorage for page refreshes
    localStorage.setItem("userCode", code);
    setUc(code);
  }, [searchParams, navigate]);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setSellCart(sellItems);
  }, [sellItems]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, activeTab, sortBy]);

  const updateQuantity = (id, newQty, stock) => {
    const nextQty = Math.max(0, Math.min(Number.parseInt(newQty || 0, 10), stock));

    setSellItems((prev) => {
      const updated = { ...prev };
      if (!nextQty) {
        delete updated[id];
      } else {
        updated[id] = nextQty;
      }
      return updated;
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lower));
    }

    if (activeTab === "all") {
      result = result.filter((p) => Number(p.quantity) > 0);
    }

    if (activeTab === "selected") {
      result = result.filter((p) => sellItems[p.id] > 0);
    }

    if (activeTab === "outOfStock") {
      result = result.filter((p) => Number(p.quantity) === 0);
    }

    result.sort((a, b) => {
      if (sortBy === "highToLow") return (b.quantity || 0) - (a.quantity || 0);
      if (sortBy === "lowToHigh") return (a.quantity || 0) - (b.quantity || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, searchTerm, activeTab, sellItems, sortBy]);

  const totalSelectedItems = Object.keys(sellItems).length;
  const totalSelectedQty = Object.values(sellItems).reduce((sum, qty) => sum + qty, 0);
  const outOfStockCount = products.filter((p) => Number(p.quantity) === 0).length;

  const goToCart = () => {
    if (!totalSelectedItems) {
      setMessage("Add products first.");
      return;
    }
    navigate(`/sell/cart?uc=${uc}`);
  };

  const getThumbUrl = (picturePath) => {
    if (!picturePath) return "";
    const separator = picturePath.includes("?") ? "&" : "?";
    return `${imageBaseUrl}${picturePath}${separator}w=140&h=140&fit=cover`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
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
            <h1 className="text-xl font-bold text-gray-800">Sell Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            {totalSelectedItems > 0 && (
              <button
                onClick={() => {
                  setSellItems({});
                  clearSellCart();
                }}
                className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 border border-gray-200 rounded-xl bg-gray-100 text-sm text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="az">A-Z</option>
            <option value="highToLow">High to Low</option>
            <option value="lowToHigh">Low to High</option>
          </select>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-lg gap-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "all" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveTab("selected")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "selected" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Selected {totalSelectedItems > 0 ? `(${totalSelectedItems})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("outOfStock")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "outOfStock" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Out of Stock {outOfStockCount > 0 ? `(${outOfStockCount})` : ""}
          </button>
        </div>
      </div>

      {message && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-center text-sm font-medium animate-fade-in">
          {message}
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden animate-pulse">
                <div className={`p-3 ${viewMode === "grid" ? "space-y-2" : "flex items-center gap-3"}`}>
                  <div className={`${viewMode === "grid" ? "w-full h-28" : "w-12 h-12"} bg-gray-200 rounded-lg flex-shrink-0`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">No products found.</div>
        ) : (
          <>
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {filteredProducts.slice(0, visibleCount).map((p) => {
              const qty = sellItems[p.id] || 0;
              const outOfStock = Number(p.quantity) === 0;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border shadow-sm overflow-hidden ${qty > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}
                >
                  <div className={`p-3 ${viewMode === "grid" ? "space-y-2" : "flex items-center gap-3"}`}>
                    <div className={`${viewMode === "grid" ? "w-full h-28" : "w-12 h-12"} overflow-hidden rounded-lg bg-gray-200 flex-shrink-0`}>
                      {p.picture ? (
                        <img
                          src={getThumbUrl(p.picture)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                      <p className="text-sm text-gray-500">
                        Stock: {outOfStock ? <span className="text-red-600">Out of Stock</span> : p.quantity}
                      </p>
                    </div>

                    {!outOfStock && (
                      <div
                        className={`flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 ${
                          viewMode === "grid" ? "w-full justify-between" : "shrink-0 ml-auto"
                        }`}
                      >
                        <button
                          onClick={() => updateQuantity(p.id, qty - 1, p.quantity)}
                          className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md"
                          disabled={qty === 0}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                          </svg>
                        </button>

                        <input
                          type="number"
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) => updateQuantity(p.id, e.target.value, p.quantity)}
                          className={`text-center font-bold bg-transparent focus:outline-none ${
                            viewMode === "grid" ? "w-14" : "w-12"
                          }`}
                        />

                        <button
                          onClick={() => updateQuantity(p.id, qty + 1, p.quantity)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                          disabled={qty >= p.quantity}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {visibleCount < filteredProducts.length && (
            <button
              onClick={() => setVisibleCount((n) => n + 20)}
              className="w-full mt-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
            >
              Load More ({filteredProducts.length - visibleCount} remaining)
            </button>
          )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_18px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Selected Items</p>
              <p className="text-2xl text-blue-900 font-bold">{totalSelectedItems}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-green-700 font-medium">Total Quantity</p>
              <p className="text-2xl text-green-900 font-bold">{totalSelectedQty}</p>
            </div>
          </div>

          <button
            onClick={goToCart}
            disabled={!totalSelectedItems}
            className={`w-full py-3 rounded-xl text-white font-semibold transition ${
              totalSelectedItems ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Go to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
