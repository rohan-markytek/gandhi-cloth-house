import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export default function AddProduct() {
  const BASE_URL = "http://localhost:8080/api";

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [picture, setPicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usercode, setUsercode] = useState("");
  const [msg, setMsg] = useState("");

  const [searchParams] = useSearchParams();
  const userRef = React.useRef("");

  useEffect(() => {
    const code = searchParams.get("usercode"); 
    console.log("USERCODE FROM URL =", code);

    setUsercode(code);
    userRef.current = code;
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("FORM SUBMITTED");
    setLoading(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("quantity", quantity);
      fd.append("usercode", '1');
      if (picture) fd.append("picture", picture);

      console.log("SENDING:", userRef.current);

      for (let [key, value] of fd.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(
        `${BASE_URL}/products/create`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMsg("Product added successfully!");
      setName("");
      setQuantity(0);
      setPicture(null);

    } catch (error) {
      console.log("API ERROR:", error);
      setMsg("Error adding product");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">

      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Add Product
        </h2>

        {/* DEBUG — REMOVE LATER */}
        <div className="mb-4 text-sm text-red-600">
          <b>Debug user:</b> {usercode}
        </div>

        {msg && (
          <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              className="w-full border px-4 py-2 rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              className="w-full border px-4 py-2 rounded-md"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border px-4 py-2 rounded-md"
              onChange={(e) => setPicture(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Product"}
          </button>

        </form>
      </div>
    </div>
  );
}
