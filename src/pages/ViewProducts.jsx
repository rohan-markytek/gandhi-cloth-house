import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ViewProducts() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;

  // Load products from API
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">

      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          View Products
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="p-3 text-left text-gray-700">Image</th>
                  <th className="p-3 text-left text-gray-700">Name</th>
                  <th className="p-3 text-left text-gray-700">Quantity</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-200 hover:bg-blue-50"
                  >
                    <td className="p-3">
                      {p.picture ? (
                        <img
                          src={`${imageBaseUrl}${p.picture}`}
                          alt="Product"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-md text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-gray-800 font-medium">{p.name}</td>

                    <td className="p-3 text-gray-700">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  );
}
