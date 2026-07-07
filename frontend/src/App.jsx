import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import { AdminRoute, ProtectedRoute } from "./components/layout/ProtectedRoute";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminDeals from "./pages/admin/AdminDeals";
import AdminHomepage from "./pages/admin/AdminHomepage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:categorySlug" element={<Catalog />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="deals" element={<AdminDeals />} />
        <Route path="homepage" element={<AdminHomepage />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin/products" element={<Navigate to="/dashboard/products" replace />} />
      <Route path="/admin/categories" element={<Navigate to="/dashboard/categories" replace />} />
      <Route path="/admin/orders" element={<Navigate to="/dashboard/orders" replace />} />
      <Route path="/admin/banners" element={<Navigate to="/dashboard/banners" replace />} />
      <Route path="/admin/users" element={<Navigate to="/dashboard/users" replace />} />
    </Routes>
  );
}
