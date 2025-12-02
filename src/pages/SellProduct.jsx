import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SellProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [sellItems, setSellItems] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState({});
  const [uc, setUc] = useState("");
  const [searchParams] = useSearchParams();

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'selected'
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  // Load all products
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
    const code = searchParams.get("uc");
    setUc(code);
  }, [searchParams]);

  // Actions
  const updateQuantity = (id, newQty, stock) => {
    if (newQty > stock) newQty = stock;
    if (newQty <= 0) {
      const updated = { ...sellItems };
      delete updated[id];
      setSellItems(updated);
    } else {
      setSellItems((prev) => ({ ...prev, [id]: newQty }));
    }
  };

  const increase = (id, stock) => {
    const current = sellItems[id] || 0;
    updateQuantity(id, current + 1, stock);
  };

  const decrease = (id, stock) => {
    const current = sellItems[id] || 0;
    updateQuantity(id, current - 1, stock);
  };

  const handleInput = (id, val, stock) => {
    const v = parseInt(val) || 0;
    updateQuantity(id, v, stock);
  };

  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let data = products;

    // 0. Filter out out-of-stock
    data = data.filter(p => p.quantity > 0);

    // 1. Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(lower));
    }

    // 2. Tab
    if (activeTab === "selected") {
      data = data.filter(p => sellItems[p.id] > 0);
    }

    return data;
  }, [products, searchTerm, activeTab, sellItems]);

  const totalSelectedItems = Object.keys(sellItems).length;
  const totalSelectedQty = Object.values(sellItems).reduce((a, b) => a + b, 0);

  // SELL ALL
  const sellAll = async () => {
    if (totalSelectedItems === 0) {
      setMessage("No items selected.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      for (const id in sellItems) {
        const qty = sellItems[id];
        const fd = new FormData();
        fd.append("quantity", qty);
        fd.append("action", "sell");
        fd.append("uc", uc);

        await axios.post(`${BASE_URL}/products/update/${id}`, fd);
      }

      setPrintData(sellItems);
      setMessage("Sold successfully!");
      setSellItems({});
      loadProducts();
      setActiveTab("all");

      setTimeout(() => window.print(), 400);
    } catch (err) {
      console.error(err);
      setMessage("Failed to sell products.");
    }
    setLoading(false);
  };

  // Swipe Button Logic
  const trackRef = useRef(null);
  const btnRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e) => {
    if (loading || totalSelectedItems === 0) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX - dragX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const trackWidth = trackRef.current?.offsetWidth || 0;
    const btnWidth = btnRef.current?.offsetWidth || 0;
    const maxDrag = trackWidth - btnWidth - 8;

    let newX = currentX - startXRef.current;
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;

    setDragX(newX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const trackWidth = trackRef.current?.offsetWidth || 0;
    const btnWidth = btnRef.current?.offsetWidth || 0;
    const maxDrag = trackWidth - btnWidth - 8;

    if (dragX > maxDrag * 0.85) {
      setDragX(maxDrag);
      sellAll();
      setTimeout(() => setDragX(0), 1000); // Reset after delay
    } else {
      setDragX(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">

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
            <h1 className="text-xl font-bold text-gray-800">Sell Products</h1>
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
            {totalSelectedItems > 0 && (
              <button
                onClick={() => setSellItems({})}
                className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            )}
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

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "all" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveTab("selected")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "selected" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Selected {totalSelectedItems > 0 && `(${totalSelectedItems})`}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-center text-sm font-medium animate-fade-in">
          {message}
        </div>
      )}

      {/* Product List/Grid */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
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
            {filteredProducts.map((p) => {
              const qty = sellItems[p.id] || 0;
              const isSelected = qty > 0;
              const isNearMax = qty >= p.quantity * 0.8;
              const percentSelected = (qty / p.quantity) * 100;

              // List View
              if (viewMode === "list") {
                return (
                  <div
                    key={p.id}
                    className={`
                      relative overflow-hidden rounded-2xl border transition-all duration-200
                      ${isSelected ? "bg-blue-50 border-blue-200 shadow-md" : "bg-white border-gray-100 shadow-sm"}
                    `}
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Image */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 border border-gray-100">
                          {p.picture ? (
                            <img
                              src={`${imageBaseUrl}${p.picture}`}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-gray-500">Stock: {p.quantity}</p>
                            {isSelected && isNearMax && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                Near Max
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Clear Button */}
                        {isSelected && (
                          <button
                            onClick={() => {
                              const updated = { ...sellItems };
                              delete updated[p.id];
                              setSellItems(updated);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center gap-2">
                        {/* Main Controls */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
                          <button
                            onClick={() => decrease(p.id, p.quantity)}
                            disabled={qty === 0}
                            className={`
                              w-8 h-8 flex items-center justify-center rounded-md transition-all
                              ${qty > 0 ? "text-blue-600 hover:bg-blue-50 active:scale-95" : "text-gray-300"}
                            `}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                            </svg>
                          </button>

                          <input
                            type="number"
                            value={qty || ""}
                            placeholder="0"
                            onChange={(e) => handleInput(p.id, e.target.value, p.quantity)}
                            className={`
                              w-12 text-center font-bold bg-transparent focus:outline-none text-base
                              ${isSelected ? "text-blue-700" : "text-gray-400"}
                            `}
                          />

                          <button
                            onClick={() => increase(p.id, p.quantity)}
                            disabled={qty >= p.quantity}
                            className={`
                              w-8 h-8 flex items-center justify-center rounded-md transition-all
                              ${qty < p.quantity ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "text-gray-300"}
                            `}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        {/* Quick Add Buttons */}
                        <div className="flex gap-1 flex-1">
                          {[1, 5, 10].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => {
                                const newQty = Math.min((qty || 0) + amount, p.quantity);
                                updateQuantity(p.id, newQty, p.quantity);
                              }}
                              disabled={qty >= p.quantity}
                              className={`
                                flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all
                                ${qty < p.quantity
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                                  : "bg-gray-50 text-gray-300 cursor-not-allowed"}
                              `}
                            >
                              +{amount}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
                        <div
                          className={`h-full transition-all duration-300 ${isNearMax ? "bg-orange-400" : "bg-blue-400"}`}
                          style={{ width: `${percentSelected}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              // Grid View
              return (
                <div
                  key={p.id}
                  className={`
                    relative overflow-hidden rounded-2xl border transition-all duration-200
                    ${isSelected ? "bg-blue-50 border-blue-200 shadow-md" : "bg-white border-gray-100 shadow-sm"}
                  `}
                >
                  {/* Image */}
                  <div className="aspect-square w-full overflow-hidden bg-gray-200">
                    {p.picture ? (
                      <img
                        src={`${imageBaseUrl}${p.picture}`}
                        alt={p.name}
                        className="w-full h-full object-cover"
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
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold text-sm line-clamp-1 flex-1 ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                        {p.name}
                      </h3>
                      {isSelected && (
                        <button
                          onClick={() => {
                            const updated = { ...sellItems };
                            delete updated[p.id];
                            setSellItems(updated);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Stock: {p.quantity}</span>
                      {isSelected && isNearMax && (
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                          Near Max
                        </span>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 mb-2">
                      <button
                        onClick={() => decrease(p.id, p.quantity)}
                        disabled={qty === 0}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-md transition-all
                          ${qty > 0 ? "text-blue-600 hover:bg-blue-50 active:scale-95" : "text-gray-300"}
                        `}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>

                      <input
                        type="number"
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => handleInput(p.id, e.target.value, p.quantity)}
                        className={`
                          flex-1 text-center font-bold bg-transparent focus:outline-none text-sm
                          ${isSelected ? "text-blue-700" : "text-gray-400"}
                        `}
                      />

                      <button
                        onClick={() => increase(p.id, p.quantity)}
                        disabled={qty >= p.quantity}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-md transition-all
                          ${qty < p.quantity ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "text-gray-300"}
                        `}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 5, 10].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            const newQty = Math.min((qty || 0) + amount, p.quantity);
                            updateQuantity(p.id, newQty, p.quantity);
                          }}
                          disabled={qty >= p.quantity}
                          className={`
                            px-2 py-1 text-xs font-semibold rounded-lg transition-all
                            ${qty < p.quantity
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                              : "bg-gray-50 text-gray-300 cursor-not-allowed"}
                          `}
                        >
                          +{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-100">
                      <div
                        className={`h-full transition-all duration-300 ${isNearMax ? "bg-orange-400" : "bg-blue-400"}`}
                        style={{ width: `${percentSelected}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 z-40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">

          {/* Summary Cards */}
          {totalSelectedItems > 0 ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs font-medium text-blue-700">Total Items</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{totalSelectedItems}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span className="text-xs font-medium text-green-700">Total Units</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{totalSelectedQty}</div>
              </div>
            </div>
          ) : (
            <div className="mb-4 text-center py-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No items selected yet</p>
            </div>
          )}

          {/* iPhone-style Swipe Slider */}
          <div
            ref={trackRef}
            className={`
              relative h-[58px] rounded-[29px] overflow-hidden select-none transition-all duration-300
              ${totalSelectedItems > 0
                ? "bg-gradient-to-r from-green-400 via-green-500 to-green-400 shadow-lg"
                : "bg-gray-200 cursor-not-allowed"}
            `}
            style={{
              boxShadow: totalSelectedItems > 0
                ? '0 4px 14px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                : 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {/* Animated shimmer effect */}
            {totalSelectedItems > 0 && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear'
                }}
              />
            )}

            {/* Text */}
            <div
              className={`absolute inset-0 flex items-center justify-center font-semibold text-[15px] tracking-wide transition-opacity duration-200 ${isDragging ? "opacity-0" : "opacity-100"
                }`}
              style={{
                paddingLeft: totalSelectedItems > 0 ? '60px' : '0',
                color: totalSelectedItems > 0 ? 'rgba(255,255,255,0.95)' : '#9ca3af',
                textShadow: totalSelectedItems > 0 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {totalSelectedItems > 0 ? "slide to complete sale" : "Select items to sell"}
            </div>

            {/* Chevron arrows (iPhone style) */}
            {totalSelectedItems > 0 && !isDragging && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-60">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Slider button (iPhone style) */}
            <div
              ref={btnRef}
              style={{
                transform: `translateX(${dragX}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                boxShadow: totalSelectedItems > 0
                  ? '0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)'
                  : '0 1px 3px rgba(0,0,0,0.1)'
              }}
              className={`
                absolute top-[3px] left-[3px] bottom-[3px] aspect-square rounded-full flex items-center justify-center
                ${totalSelectedItems > 0
                  ? "bg-white cursor-grab active:cursor-grabbing"
                  : "bg-gray-300"}
              `}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Arrow icon in slider */}
              <svg
                className={`w-6 h-6 transition-colors ${totalSelectedItems > 0 ? "text-green-500" : "text-gray-400"
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Print Area */}
      <div id="print-area" className="hidden print:block">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Sell Receipt</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(printData).map((id) => {
                const product = products.find((x) => x.id == id);
                return (
                  <tr key={id} className="border-b border-gray-200">
                    <td className="py-2">{product?.name}</td>
                    <td className="py-2 text-right">{printData[id]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-8 text-sm text-gray-500">Date: {new Date().toLocaleString()}</p>
        </div>
      </div>

    </div>
  );
}
