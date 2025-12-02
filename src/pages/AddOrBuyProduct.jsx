import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AddOrBuyProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(`/?uc=${uc}`)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Manage Inventory</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => { setMode("buy"); setMessage(""); }}
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

      <div className="p-4 max-w-2xl mx-auto">

        {/* ================== ADD STOCK MODE ================== */}
        {mode === "buy" && (
          <div className="space-y-6">

            {/* 1. Select Product */}
            {!selectedProduct ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Search product to add stock..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="space-y-2">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800">{p.name}</h3>
                        <p className="text-sm text-gray-500">Current Stock: {p.quantity}</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No products found</div>
                  )}
                </div>
              </div>
            ) : (
              /* 2. Add Quantity Form */
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
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
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

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
