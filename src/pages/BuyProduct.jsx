import React, { useEffect, useState } from "react";
import axios from "axios";

export default function BuyProduct() {
  const BASE_URL = "http://localhost:8080/api"; // CI4 base API
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load products from API
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

  // Buy product (add quantity)
  const handleBuy = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!productId || !quantity) {
      setMessage("Please select a product and enter quantity.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("quantity", quantity);
      fd.append("action", "buy");

      await axios.post(`${BASE_URL}/products/update/${productId}`, fd);

      setMessage("Stock updated successfully!");
      setProductId("");
      setQuantity("");
      loadProducts(); // refresh product list
    } catch (error) {
      console.error(error);
      setMessage("Failed to update stock.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Buy Product (Add Stock)
        </h2>

        {message && (
          <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleBuy} className="space-y-6">

          {/* Product Dropdown */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Select Product
            </label>

            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Quantity to Add
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* Buy Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition"
          >
            {loading ? "Processing..." : "Add Stock"}
          </button>

        </form>

      </div>
    </div>
  );
}
