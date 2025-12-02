import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = searchParams.get("uc");

  const menu = [
    {
      title: "Add Product",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      ),
      route: "/add",
      color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
    },
    {
      title: "Sell Product",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      route: "/sell",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
    },
    {
      title: "View Products",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      route: "/products",
      color: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-24 pb-8">
      <div className="w-full max-w-md md:max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">
          Inventory Dashboard
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menu.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(`${item.route}?uc=${user}`)}
              className={`
                ${item.color} border rounded-2xl p-6 
                flex flex-col items-center justify-center gap-3 
                cursor-pointer transition-all duration-200 
                hover:shadow-lg active:scale-95 aspect-[4/3]
                ${index === 2 ? "col-span-2 md:col-span-1 aspect-auto md:aspect-[4/3] py-8 md:py-6" : ""}
              `}
            >
              <div className="p-3 bg-white bg-opacity-60 rounded-xl shadow-sm backdrop-blur-sm">
                {item.icon}
              </div>
              <span className="font-semibold text-base">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
