import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = searchParams.get("usercode");

  const menu = [
    { title: "Add Product", icon: "📦", route: "/add" },
    { title: "Sell Product", icon: "💸", route: "/sell" },
    /*{ title: "Buy Product", icon: "🛒", route: "/buy" },*/
    { title: "View Products", icon: "📊", route: "/products" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">

      <h1 className="text-3xl font-bold text-gray-800 mb-10 tracking-wide">
        Inventory Dashboard
      </h1>

      <div className="grid w-full max-w-md gap-6">

        {menu.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(`${item.route}?usercode=${user}`)}
            className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm 
                       p-6 flex items-center gap-4 cursor-pointer
                       transition hover:shadow-md hover:bg-blue-100 active:scale-95"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-lg font-semibold text-blue-900">{item.title}</span>
          </div>
        ))}

      </div>
    </div>
  );
}
