import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AddOrBuyProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;

  // State
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState("buy"); // 'buy' (Add Stock) | 'add' (New Product)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uc, setUc] = useState("");
  const [searchParams] = useSearchParams();

  // Buy Mode State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [addStockQty, setAddStockQty] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  // Add Mode State
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newPicture, setNewPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Load Data
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProducts();
    const code = searchParams.get("uc");
    setUc(code);
  }, [searchParams]);

  // Filter Products for Buy Mode
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lower));
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() =>
    products.find(p => p.id === selectedProductId),
    [products, selectedProductId]);

  // Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("uc", uc);

      if (mode === "add") {
        fd.append("name", newName);
        fd.append("quantity", newQty);
        if (newPicture) fd.append("picture", newPicture);

        await axios.post(`${BASE_URL}/products/create`, fd);
        setMessage("Product created successfully!");

        // Reset
        setNewName("");
        setNewQty("");
        setNewPicture(null);
        setPreviewUrl(null);
      }
      else if (mode === "buy") {
        if (!selectedProductId) return;

        fd.append("quantity", addStockQty);
        fd.append("action", "buy");

        await axios.post(`${BASE_URL}/products/update/${selectedProductId}`, fd);
        setMessage("Stock updated successfully!");

        // Reset
        setAddStockQty("");
        setSelectedProductId(null);
        setSearchTerm("");
      }

      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error(error);
      setMessage("Operation failed. Please try again.");
    }
    setLoading(false);
  };

  // Render product in list view
  const renderListView = (p) => {
    return (
      <div
        key={p.id}
        onClick={() => setSelectedProductId(p.id)}
        className="relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md bg-white border-gray-100 cursor-pointer active:scale-[0.98]"
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
            <p className="text-sm text-gray-500">Current Stock: {p.quantity}</p>
          </div>

          {/* Add Icon */}
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  // Render product in grid view
  const renderGridView = (p) => {
    return (
      <div
        key={p.id}
        onClick={() => setSelectedProductId(p.id)}
        className="relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md bg-white border-gray-100 cursor-pointer active:scale-[0.98]"
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
            <span className="text-sm text-gray-500">Stock: {p.quantity}</span>
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
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
            <h1 className="text-xl font-bold text-gray-800">Manage Inventory</h1>
          </div>

          {/* View Mode Toggle - Only show in buy mode when no product selected */}
          {mode === "buy" && !selectedProduct && (
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
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => { setMode("buy"); setMessage(""); setSelectedProductId(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "buy" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Add Stock
          </button>
          <button
            onClick={() => { setMode("add"); setMessage(""); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "add" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            New Product
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="mx-4 mt-4 p-4 bg-green-50 text-green-700 rounded-xl text-center font-medium border border-green-100 animate-fade-in">
          {message}
        </div>
      )}

      <div className="p-4">

        {/* ================== ADD STOCK MODE ================== */}
        {mode === "buy" && (
          <div className="space-y-6">

            {/* 1. Select Product */}
            {!selectedProduct ? (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    placeholder="Search product to add stock..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Product List/Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500 mt-3">No products found</p>
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
            ) : (
              /* 2. Add Quantity Form */
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in max-w-2xl mx-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <p className="text-gray-500">Current Stock: {selectedProduct.quantity}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProductId(null)}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity to Add
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      autoFocus
                      className="w-full text-3xl font-bold text-center py-4 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:outline-none text-blue-600 placeholder-blue-200"
                      placeholder="0"
                      value={addStockQty}
                      onChange={(e) => setAddStockQty(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70"
                  >
                    {loading ? "Updating..." : "Confirm Add Stock"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================== NEW PRODUCT MODE ================== */}
        {mode === "add" && (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">

            {/* Image Upload */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${previewUrl ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500">Add Photo</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {previewUrl && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}
              </label>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Cotton Shirt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
