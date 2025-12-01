import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export default function SellProduct() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [products, setProducts] = useState([]);
  const [sellItems, setSellItems] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState({}); // for printing
  const [usercode, setUsercode] = useState("");
  const [searchParams] = useSearchParams();
  const userRef = React.useRef("");

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
  }, []);

  useEffect(() => {
    const code = searchParams.get("usercode"); 
    console.log("USERCODE FROM URL =", code);

    setUsercode(code);
    userRef.current = code;
  }, []);

  // Increase qty
  const increase = (id, stock) => {
    setSellItems((prev) => {
      const newQty = (prev[id] || 0) + 1;
      if (newQty > stock) return prev;
      return { ...prev, [id]: newQty };
    });
  };

  // Decrease qty
  const decrease = (id) => {
    setSellItems((prev) => {
      const newQty = (prev[id] || 0) - 1;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: newQty };
    });
  };

  // Manual input
  const handleInput = (id, value, stock) => {
    let v = parseInt(value) || 0;
    if (v > stock) v = stock;

    if (v <= 0) {
      const updated = { ...sellItems };
      delete updated[id];
      setSellItems(updated);
      return;
    }

    setSellItems((prev) => ({ ...prev, [id]: v }));
  };

  // SELL ALL — Batch Selling
  const sellAll = async () => {
    if (Object.keys(sellItems).length === 0) {
      setMessage("No items selected to sell.");
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
        fd.append("usercode", usercode);

        await axios.post(`${BASE_URL}/products/update/${id}`, fd);
      }

      // save data for print
      setPrintData(sellItems);

      setMessage("All selected products sold successfully!");
      setSellItems({});
      loadProducts();

      // Trigger print window
      setTimeout(() => window.print(), 400);

    } catch (err) {
      console.error(err);
      setMessage("Failed to sell products.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">

      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Sell Products
        </h2>

        {message && (
          <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded text-center font-medium">
            {message}
          </div>
        )}

        {/* Product List */}
        <div className="space-y-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
            >
              {/* Product Name + Stock */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900">{p.name}</h3>
                <p className="text-gray-700">Stock: {p.quantity}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrease(p.id)}
                  disabled={!sellItems[p.id]}
                  className="bg-red-500 text-white w-10 h-10 rounded-lg disabled:bg-red-300"
                >
                  –
                </button>

                <input
                  type="number"
                  min="0"
                  max={p.quantity}
                  value={sellItems[p.id] || ""}
                  onChange={(e) =>
                    handleInput(p.id, e.target.value, p.quantity)
                  }
                  className="w-16 text-center border border-gray-300 rounded-lg py-2"
                />

                <button
                  onClick={() => increase(p.id, p.quantity)}
                  disabled={sellItems[p.id] >= p.quantity}
                  className="bg-green-600 text-white w-10 h-10 rounded-lg disabled:bg-green-300"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sell All Button */}
        {/* <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t flex justify-center z-50">
          <button
            onClick={sellAll}
            disabled={loading}
            className="w-full max-w-4xl bg-blue-600 text-white py-3 text-lg rounded-lg hover:bg-blue-700 active:scale-95 transition"
          >
            {loading ? "Processing..." : "Sell All Selected Products"}
          </button>
        </div> */}

        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t flex justify-center z-50">

  <div
    id="swipeTrack"
    className="w-full max-w-4xl h-14 bg-gray-800 rounded-full relative overflow-hidden select-none transition-all duration-300 hover:shadow-[0_0_12px_rgba(255,255,255,0.4)]"
  >
    {/* Center Text */}
    <div
      id="swipeText"
      className="absolute inset-0 flex items-center justify-center text-md text-white pointer-events-none transition-opacity duration-300"
      style={{ paddingLeft: "55px" }}
    >
      Sell All Selected Products
    </div>

    {/* Glow while dragging */}
    <div
      id="dragGlow"
      className="absolute inset-0 bg-blue-500 opacity-0 transition-opacity duration-300 pointer-events-none"
      style={{ filter: "blur(25px)" }}
    ></div>

    {/* Swipe Button */}
    <div
      id="swipeBtn"
      className="absolute top-[3px] left-[3px] h-[50px] w-[50px] rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform duration-150 active:scale-90 shadow-lg"
      style={{
        background: "linear-gradient(135deg, #2563eb, #1e40af)",
      }}
      onTouchStart={(e) => {
        window.dragging = true;
        window.startX = e.touches[0].clientX - e.target.offsetLeft;

        // Hide text + show glow
        document.getElementById("swipeText").style.opacity = 0;
        document.getElementById("dragGlow").style.opacity = 0.4;
      }}
      onTouchMove={(e) => {
        if (!window.dragging) return;

        const track = document.getElementById("swipeTrack");
        const btn = document.getElementById("swipeBtn");

        let x = e.touches[0].clientX - window.startX;
        const maxX = track.offsetWidth - btn.offsetWidth - 6;

        if (x < 3) x = 3;
        if (x > maxX) x = maxX;

        btn.style.left = x + "px";
      }}
      onTouchEnd={() => {
        window.dragging = false;

        const track = document.getElementById("swipeTrack");
        const btn = document.getElementById("swipeBtn");
        const text = document.getElementById("swipeText");
        const glow = document.getElementById("dragGlow");

        const maxX = track.offsetWidth - btn.offsetWidth - 6;

        if (parseInt(btn.style.left) >= maxX * 0.9) {
          btn.style.left = maxX + "px";

          // Glow stays hidden
          glow.style.opacity = 0;

          // Button pulse animation
          btn.style.transition = "transform 0.3s ease";
          btn.style.transform = "scale(1.15)";
          setTimeout(() => {
            btn.style.transform = "scale(1)";
          }, 300);

          sellAll();
        } else {
          // Glow disappear
          glow.style.opacity = 0;

          // Reset text + button
          text.style.opacity = 1;
          btn.style.left = "3px";
        }
      }}
    >
      ➤
    </div>
  </div>

</div>






        {/* ---------------------- */}
        {/* PRINT TEMPLATE SECTION */}
        {/* ---------------------- */}
        <div id="print-area" className="print:block hidden p-6 text-black">
          <div className="hidden print:block p-6">

            <h2 className="text-xl font-bold mb-2">Gandhi Cloth House</h2>
            <p className="text-sm mb-4">Sell Receipt</p>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Product</th>
                  <th className="border p-2 text-left">Qty Sold</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(printData).map((id) => {
                  const product = products.find((x) => x.id == id);
                  return (
                    <tr key={id}>
                      <td className="border p-2">{product?.name}</td>
                      <td className="border p-2">{printData[id]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-4 text-sm">Date: {new Date().toLocaleString()}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
