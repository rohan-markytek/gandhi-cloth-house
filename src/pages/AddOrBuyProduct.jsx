import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export default function AddOrBuyProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState("buy"); // add | buy

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [picture, setPicture] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [usercode, setUsercode] = useState("");
  const [searchParams] = useSearchParams();
  const userRef = React.useRef("");

  useEffect(() => {
    const code = searchParams.get("usercode"); 
    console.log("USERCODE FROM URL =", code);

    setUsercode(code);
    userRef.current = code;
  }, []);

  /** Load product list */
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
  }, []);

  /** Handle Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const fd = new FormData();

      /** ADD NEW PRODUCT */
      if (mode === "add") {
        fd.append("name", name);
        fd.append("quantity", quantity);
        fd.append("usercode", usercode);
        if (picture) fd.append("picture", picture);

        await axios.post(`${BASE_URL}/products/create`, fd);

        setMessage("Product added successfully!");
        setName("");
        setQuantity("");
        setPicture(null);
        loadProducts();
      }

      /** ADD STOCK TO EXISTING PRODUCT */
      if (mode === "buy") {
        if (!productId) {
          setMessage("Select a product");
          setLoading(false);
          return;
        }
        fd.append("quantity", quantity);
        fd.append("action", "buy");
        fd.append("usercode", usercode);

        await axios.post(`${BASE_URL}/products/update/${productId}`, fd);

        setMessage("Stock updated successfully!");
        setQuantity("");
        setProductId("");
        loadProducts();
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {mode === "add" ? "New Product" : "Add Stock"}
        </h2>

        {/* Message */}
        {message && (
          <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded">
            {message}
          </div>
        )}

        {/* Mode Switch */}
        <div className="flex gap-4 mb-6">
          {/*<button
            onClick={() => setMode("add")}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === "add"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            New Product
          </button>*/}

          {/*<button
            onClick={() => setMode("buy")}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === "buy"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Add Stock
          </button>*/}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BUY MODE → Product dropdown */}
          {mode === "buy" && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Select Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ADD MODE → Product Name */}
          {mode === "add" && (
            <div>
              <label className="block text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                className="w-full border px-4 py-2 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === "add"}
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-gray-700 mb-1">
              Quantity {mode === "buy" ? "to Add" : ""}
            </label>
            <input
              type="number"
              min="1"
              className="w-full border px-4 py-2 rounded-md"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          {/* ADD MODE → Image */}
          {mode === "add" && (
            <div>
              <label className="block text-gray-700 mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full border px-4 py-2 rounded-md"
                onChange={(e) => setPicture(e.target.files[0])}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : mode === "add"
              ? "Add Product"
              : "Add Stock"}
          </button>
        </form>

      </div>
    </div>
  );
}
