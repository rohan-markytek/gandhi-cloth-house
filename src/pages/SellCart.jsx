import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
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
  const [receiptInfo, setReceiptInfo] = useState(null);

  const trackRef = useRef(null);
  const btnRef = useRef(null);
  const saleInProgressRef = useRef(false);
  const receiptUrlRef = useRef("");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    setSellCart(cart);
  }, [cart]);

  useEffect(() => {
    return () => {
      if (receiptUrlRef.current) {
        URL.revokeObjectURL(receiptUrlRef.current);
      }
    };
  }, []);

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

  const updateReceiptInfo = (nextReceiptInfo) => {
    if (receiptUrlRef.current) {
      URL.revokeObjectURL(receiptUrlRef.current);
    }

    receiptUrlRef.current = nextReceiptInfo?.url || "";
    setReceiptInfo(nextReceiptInfo);
  };

  const createSaleReceiptPdf = ({ challanNo, soldRows }) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a5",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    const qtyX = pageWidth - margin - 10;
    const amountX = qtyX - 22;
    const rateX = amountX - 24;
    const meterX = rateX - 20;
    const descWidth = meterX - margin - 14;
    const boxX = pageWidth - margin - 2;
    const now = new Date();
    let y = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Shree Ganeshay Namah", pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(15);
    doc.text("CLOTH STORE (G)", pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("[ ] Original For Recipient   [ ] Duplicate For Transporter   [ ] Triplicate For Supplier", pageWidth / 2, y, { align: "center" });
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PACKING SLIP ONLY", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(11);
    doc.text(`CHALLAN NO.: ${challanNo}`, margin, y);
    doc.text(`DATE: ${now.toLocaleDateString("en-IN")}`, pageWidth - margin, y, { align: "right" });
    y += 5;
    doc.text(`TIME: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`, pageWidth - margin, y, { align: "right" });
    y += 4;

    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("HSN / Description", margin + 1, y);
    doc.text("Meter", meterX, y, { align: "right" });
    doc.text("Rate", rateX, y, { align: "right" });
    doc.text("Amount", amountX, y, { align: "right" });
    doc.text("Pcs", qtyX, y, { align: "right" });
    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    soldRows.forEach((row) => {
      const wrappedName = doc.splitTextToSize(row.name || "-", descWidth);
      const rowHeight = Math.max(6, wrappedName.length * 4);

      if (y + rowHeight + 18 > pageHeight) {
        doc.addPage("a5", "landscape");
        y = 12;
      }

      doc.text(wrappedName, margin + 1, y + 3);
      doc.text("", meterX, y + 3, { align: "right" });
      doc.text("", rateX, y + 3, { align: "right" });
      doc.text("", amountX, y + 3, { align: "right" });
      doc.text(String(row.qty), qtyX, y + 3, { align: "right" });
      doc.roundedRect(boxX - 4, y + 0.2, 5, 3.8, 0.4, 0.4);
      y += rowHeight;
      doc.setDrawColor(180);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setDrawColor(0);
      y += 2;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Net Total.....", meterX - 15, y + 2, { align: "right" });
    doc.text("", meterX, y + 2, { align: "right" });
    doc.text("", rateX, y + 2, { align: "right" });
    doc.text("", amountX, y + 2, { align: "right" });
    doc.text(String(soldRows.reduce((sum, row) => sum + row.qty, 0)), qtyX, y + 2, { align: "right" });
    doc.roundedRect(boxX - 4, y - 0.8, 5, 3.8, 0.4, 0.4);

    y += 10;
    doc.text("!!! Thanks !!! Visit Again !!!", margin, y);

    y += 10;
    doc.line(pageWidth - 58, y, pageWidth - margin, y);
    doc.setFont("helvetica", "normal");
    doc.text("Signature", pageWidth - 32, y + 4, { align: "center" });

    const filename = `sale-receipt-${challanNo}.pdf`;
    const blob = doc.output("blob");

    return {
      url: URL.createObjectURL(blob),
      filename,
      challanNo,
    };
  };

  const openReceiptPdf = (nextReceiptInfo = receiptInfo) => {
    if (!nextReceiptInfo?.url) return;

    const link = document.createElement("a");
    link.href = nextReceiptInfo.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadReceiptPdf = () => {
    if (!receiptInfo?.url) return;

    const link = document.createElement("a");
    link.href = receiptInfo.url;
    link.download = receiptInfo.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
      const soldRows = cartRows.map((row) => ({
        id: row.id,
        name: row.product.name,
        qty: row.qty,
      }));

      for (const row of cartRows) {
        const fd = new FormData();
        fd.append("quantity", row.qty);
        fd.append("action", "sell");
        fd.append("uc", uc);
        fd.append("challan_no", challanNo);

        await axios.post(`${BASE_URL}/products/update/${row.id}`, fd);
      }

      setCart({});
      clearSellCart();
      await loadProducts();

      const nextReceiptInfo = createSaleReceiptPdf({ challanNo, soldRows });
      updateReceiptInfo(nextReceiptInfo);
      setMessage("Sale completed. Receipt PDF is ready.");
      setTimeout(() => openReceiptPdf(nextReceiptInfo), 150);
    } catch (error) {
      console.error(error);
      setMessage("Failed to complete sale.");
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

      {receiptInfo && (
        <div className="mx-4 mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-800">Sale receipt ready</p>
              <p className="mt-1 text-xs text-green-700">Challan No.: {receiptInfo.challanNo}</p>
            </div>
            <button
              onClick={() => navigate(`/sell?uc=${uc}`)}
              className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800"
            >
              Back to Sell
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => openReceiptPdf()}
              className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white"
            >
              Open PDF
            </button>
            <button
              onClick={downloadReceiptPdf}
              className="flex-1 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800"
            >
              Download PDF
            </button>
          </div>
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
    </div>
  );
}
