import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AddProduct from "./pages/AddProduct";
import ViewProducts from "./pages/ViewProducts";
import SellProduct from "./pages/SellProduct";
import BuyProduct from "./pages/BuyProduct";
import AddOrBuyProduct from "./pages/AddOrBuyProduct";
import NotFound from "./pages/NotFound";


export default function App() {
  return (
    <BrowserRouter>
      <Header />
        <main className="min-h-[80vh] pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ViewProducts />} />
            <Route path="/sell" element={<SellProduct />} />
            <Route path="/buy" element={<BuyProduct />} />
            <Route path="/add" element={<AddOrBuyProduct />} />
            <Route path="/404" element={<NotFound />} />
          </Routes>
        </main>
      <Footer />
    </BrowserRouter>
  );
}
