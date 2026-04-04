import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearSellCart, getSellCart, setSellCart } from "../utils/sellCart";

export default function SellCart() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const imageBaseUrl = import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [uc, setUc] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => getSellCart());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [challanNumber, setChallanNumber] = useState("");
  const [printData, setPrintData] = useState({});

  const trackRef = useRef(null);
  const btnRef = useRef(null);
  const saleInProgressRef = useRef(false);
  const printTriggeredRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  useEffect(() => {
    const code = searchParams.get("uc");
    if (!code || code.trim() === "" || code === "null") {
      navigate("/404");
      return;
    }
    setUc(code);
  }, [searchParams, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    setSellCart(cart);
  }, [cart]);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load products.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Keep cart valid with current stock.
    if (!products.length) return;

    setCart((prev) => {
      const updated = { ...prev };
      let changed = false;

      Object.keys(updated).forEach((id) => {
        const product = products.find((p) => String(p.id) === String(id));
        if (!product || product.quantity <= 0) {
          delete updated[id];
          changed = true;
          return;
        }

        if (updated[id] > product.quantity) {
          updated[id] = product.quantity;
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [products]);

  const cartRows = useMemo(() => {
    const grouped = {};

    Object.entries(cart).forEach(([id, qty]) => {
      const product = products.find((p) => String(p.id) === String(id));
      if (!product) return;

      const normalizedId = String(product.id);
      const parsedQty = Number.parseInt(qty, 10) || 0;
      if (!parsedQty) return;

      if (!grouped[normalizedId]) {
        grouped[normalizedId] = { id: normalizedId, qty: 0, product };
      }

      grouped[normalizedId].qty += parsedQty;
    });

    return Object.values(grouped).map((row) => ({
      ...row,
      qty: Math.min(row.qty, row.product.quantity),
    }));
  }, [cart, products]);

  const totalSelectedItems = cartRows.length;
  const totalSelectedQty = cartRows.reduce((sum, row) => sum + row.qty, 0);

  const updateQuantity = (id, qty, stock) => {
    const nextQty = Math.max(0, Math.min(Number.parseInt(qty || 0, 10), stock));

    setCart((prev) => {
      const updated = { ...prev };
      if (!nextQty) {
        delete updated[id];
      } else {
        updated[id] = nextQty;
      }
      return updated;
    });
  };

  const removeItem = (id) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

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

    let nextX = currentX - startXRef.current;
    nextX = Math.max(0, Math.min(nextX, maxDrag));
    setDragX(nextX);
  };

  const sellAll = async () => {
    if (saleInProgressRef.current) return;
    if (!totalSelectedItems) {
      setMessage("No items in cart.");
      return;
    }

    saleInProgressRef.current = true;
    setLoading(true);
    setMessage("");

    try {
      const challanRes = await axios.post(`${BASE_URL}/products/challanNo`);
      const challanNo = challanRes.data.challan_no;
      setChallanNumber(challanNo);

      for (const row of cartRows) {
        const fd = new FormData();
        fd.append("quantity", row.qty);
        fd.append("action", "sell");
        fd.append("uc", uc);
        fd.append("challan_no", challanNo);

        await axios.post(`${BASE_URL}/products/update/${row.id}`, fd);
      }

      const soldData = cartRows.reduce((acc, row) => {
        acc[row.id] = (acc[row.id] || 0) + row.qty;
        return acc;
      }, {});

      setPrintData(soldData);
      setCart({});
      clearSellCart();
      await loadProducts();

      setMessage("Sale completed. Print dialog opened so you can save as PDF.");

      if (!printTriggeredRef.current) {
        printTriggeredRef.current = true;
        setTimeout(() => {
          window.onafterprint = () => {
            window.onafterprint = null;
            printTriggeredRef.current = false;
            navigate(`/sell?uc=${uc}`);
          };
          window.print();
        }, 400);
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to complete sale.");
      printTriggeredRef.current = false;
    } finally {
      setLoading(false);
      saleInProgressRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    const trackWidth = trackRef.current?.offsetWidth || 0;
    const btnWidth = btnRef.current?.offsetWidth || 0;
    const maxDrag = trackWidth - btnWidth - 8;

    if (dragX > maxDrag * 0.85) {
      setDragX(maxDrag);
      sellAll();
      setTimeout(() => setDragX(0), 1000);
      return;
    }

    setDragX(0);
  };

  const totalSoldQty = useMemo(() => {
    return Object.values(printData).reduce((sum, qty) => sum + qty, 0);
  }, [printData]);

  const getThumbUrl = (picturePath) => {
    if (!picturePath) return "";
    if (picturePath.startsWith("http://") || picturePath.startsWith("https://")) {
      return picturePath;
    }
    return `${imageBaseUrl}${picturePath}`;
  };

  return (
    <div className="bg-gray-50 pb-32">
      <div id="sell-cart-screen">
      <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/sell?uc=${uc}`)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Sell Cart</h1>
          </div>
          <button
            onClick={() => navigate(`/sell?uc=${uc}`)}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Back to Sell
          </button>
        </div>
      </div>

      {message && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium animate-fade-in">
          {message}
        </div>
      )}

      <div className="p-4 space-y-3">
        {cartRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
            Cart is empty. Add products from Sell page.
          </div>
        ) : (
          cartRows.map((row) => (
            <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="flex items-stretch gap-3">
                <div className="w-24 rounded-xl overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0">
                    {row.product.picture ? (
                      <img
                        src={getThumbUrl(row.product.picture)}
                        alt={row.product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 truncate">{row.product.name}</h3>
                    <p className="text-sm text-gray-500">Available stock: {row.product.quantity}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() => updateQuantity(row.id, row.qty - 1, row.product.quantity)}
                        className="w-9 h-9 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>

                      <input
                        type="number"
                        value={row.qty}
                        min="0"
                        max={row.product.quantity}
                        onChange={(e) => updateQuantity(row.id, e.target.value, row.product.quantity)}
                        className="w-16 text-center font-bold bg-transparent focus:outline-none"
                      />

                      <button
                        onClick={() => updateQuantity(row.id, row.qty + 1, row.product.quantity)}
                        className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                        disabled={row.qty >= row.product.quantity}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(row.id)}
                      className="h-11 w-11 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg border border-red-100"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Cart Items</p>
              <p className="text-2xl font-bold text-blue-900">{totalSelectedItems}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-green-700 font-medium">Total Units</p>
              <p className="text-2xl font-bold text-green-900">{totalSelectedQty}</p>
            </div>
          </div>

          <div
            ref={trackRef}
            className={`relative h-[58px] rounded-[29px] overflow-hidden select-none ${totalSelectedItems > 0 ? "bg-gradient-to-r from-green-400 via-green-500 to-green-400" : "bg-gray-200"}`}
          >
            {totalSelectedItems > 0 && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite linear",
                }}
              />
            )}

            <div
              className={`absolute inset-0 flex items-center justify-center font-semibold text-[15px] tracking-wide transition-opacity ${isDragging ? "opacity-0" : "opacity-100"}`}
              style={{
                paddingLeft: totalSelectedItems > 0 ? "60px" : "0",
                color: totalSelectedItems > 0 ? "rgba(255,255,255,0.95)" : "#9ca3af",
              }}
            >
              {totalSelectedItems > 0 ? "Slide to sale" : "Cart is empty"}
            </div>

            {totalSelectedItems > 0 && !isDragging && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-60">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}

            <div
              ref={btnRef}
              style={{
                transform: `translateX(${dragX}px)`,
                transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
              }}
              className={`absolute top-[3px] left-[3px] bottom-[3px] aspect-square rounded-full flex items-center justify-center ${totalSelectedItems > 0 ? "bg-white" : "bg-gray-300"}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <svg className={`w-6 h-6 ${totalSelectedItems > 0 ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div id="print-area" className="hidden print:block text-[12px] leading-tight m-0 p-0">
        <div>
          <div className="text-center">
            <p className="font-bold text-[14px] border-b border-dashed border-black pb-1">Shree Ganeshay Namah</p>
            <p className="font-bold text-[16px] pt-0.5">CLOTH STORE (G)</p>
            <p className="border-b border-dashed border-black pb-1 pt-0.5 text-[10px]">[ ] Original For Receipient   [ ] Duplicate For Transporter   [ ] Triplicate For Supplier</p>
            <p className="font-bold text-[16px] pt-0.5">PACKING SLIP ONLY</p>
          </div>

          <div className="flex justify-between mt-1">
            <div className="text-[12px]">CHALLAN NO.: <b>{challanNumber}</b></div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 text-right text-[12px]">
              <span>DATE:</span>
              <b>{new Date().toLocaleDateString("en-IN")}</b>
              <span>TIME:</span>
              <b>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</b>
            </div>
          </div>

          <table className="w-full mt-2 border-t border-dashed border-black">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-1 text-[12px] font-semibold">HSN / Description</th>
                <th className="text-right py-1 text-[12px] font-semibold">Pcs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(printData).map((id) => {
                const product = products.find((x) => String(x.id) === String(id));
                return (
                  <tr key={id} className="border-b border-dashed border-gray-300">
                    <td className="py-1 text-[11px]">{product?.name || "-"}</td>
                    <td className="py-1 text-right text-[11px]">{printData[id]}</td>
                    <td className="py-1 text-center text-[11px]"><span className="inline-block w-6 h-3.5 border border-black rounded-sm"></span></td>
                  </tr>
                );
              })}
            </tbody>
            <tr className="border-b border-dashed border-black">
              <th className="text-center py-1 text-[12px] font-bold">Net Total.....</th>
              <th className="text-right py-1 text-[12px] font-bold">{totalSoldQty}</th>
              <th><span className="inline-block w-6 h-3.5 border border-black rounded-sm"></span></th>
            </tr>
          </table>

          <p className="text-left mt-3 text-[11px] font-semibold print:break-inside-avoid">!!! Thanks !!! Visit Again !!!</p>

          <div className="mt-1.5 flex justify-end">
            <div className="w-56 text-right">
              <div className="border-t border-dashed border-black pt-1 text-center text-[12px]">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
