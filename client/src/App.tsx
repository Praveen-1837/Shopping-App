import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import SignUpPage from './pages/SignUp';
import MyAccount from './pages/MyAccount';
import ProductDetail from './pages/ProductDetail';
import AddEditProduct from './pages/AddEditProduct';
import MyProducts from './pages/MyProducts';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AddEditCourse from './pages/AddEditCourse';
import MyLearning from './pages/MyLearning';
import CoursePlayer from './pages/CoursePlayer';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import SellerFulfillmentQueue from './pages/SellerFulfillmentQueue';
import ProducerDetail from './pages/ProducerDetail';
import SellerCentre from './pages/SellerCentre';
import FarmerCentre from './pages/FarmerCentre';
import EducatorCentre from './pages/EducatorCentre';
import ApplyRole from './pages/ApplyRole';
import AdminOnboarding from './pages/AdminOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/AdminCategories';
import AdminBanners from './pages/AdminBanners';
import AdminUsers from './pages/AdminUsers';
import AdminStores from './pages/AdminStores';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminSettings from './pages/AdminSettings';
import About from './pages/About';
import Careers from './pages/Careers';
import Help from './pages/Help';
import Returns from './pages/Returns';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const SELLER_ROLES = ['SELLER', 'FARMER', 'ARTISAN', 'ADMIN'];
const FARMER_ROLES = ['FARMER', 'SELLER', 'ARTISAN', 'ADMIN'];
const EDUCATOR_ROLES = ['EDUCATOR', 'ADMIN'];
const ADMIN_ROLES = ['ADMIN'];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between font-body relative">
        <div>
          <Navbar />
          <main>
            <ErrorBoundary>
              <Routes>
              {/* Public Catalog & Information Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/category/:categoryName" element={<Shop />} />
              <Route path="/category/:categoryName" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/producer/:id" element={<ProducerDetail />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login/*" element={<Login />} />
              <Route path="/signup/*" element={<SignUpPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/help" element={<Help />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Protected Customer Routes */}
              <Route
                path="/my-account"
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apply"
                element={
                  <ProtectedRoute>
                    <ApplyRole />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/payment"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-confirmation/:id"
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-world/orders"
                element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-world/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-world/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-world/courses"
                element={
                  <ProtectedRoute>
                    <MyLearning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-world/courses/:id/learn"
                element={
                  <ProtectedRoute>
                    <CoursePlayer />
                  </ProtectedRoute>
                }
              />

              {/* Educator Centre & Management Routes */}
              <Route
                path="/educator-centre"
                element={
                  <ProtectedRoute allowedRoles={EDUCATOR_ROLES}>
                    <EducatorCentre />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/educator/centre"
                element={
                  <ProtectedRoute allowedRoles={EDUCATOR_ROLES}>
                    <EducatorCentre />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/educator/courses/new"
                element={
                  <ProtectedRoute allowedRoles={EDUCATOR_ROLES}>
                    <AddEditCourse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/educator/courses/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={EDUCATOR_ROLES}>
                    <AddEditCourse />
                  </ProtectedRoute>
                }
              />

              {/* Protected Seller / Farmer / Artisan Dashboards & Product Management Routes */}
              <Route
                path="/seller-centre"
                element={
                  <ProtectedRoute allowedRoles={SELLER_ROLES}>
                    <SellerCentre />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer-centre"
                element={
                  <ProtectedRoute allowedRoles={FARMER_ROLES}>
                    <FarmerCentre />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/products"
                element={
                  <ProtectedRoute allowedRoles={SELLER_ROLES}>
                    <MyProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/products/new"
                element={
                  <ProtectedRoute allowedRoles={SELLER_ROLES}>
                    <AddEditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/products/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={SELLER_ROLES}>
                    <AddEditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-centre/orders"
                element={
                  <ProtectedRoute allowedRoles={SELLER_ROLES}>
                    <SellerFulfillmentQueue />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard & Management Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/onboarding"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/banners"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminBanners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminStores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
                    <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-3">
                      <h2 className="text-2xl font-bold font-heading text-primary">Page Not Found</h2>
                      <p className="text-xs text-text-secondary">
                        The requested page path does not exist or has been moved.
                      </p>
                      <a
                        href="/"
                        className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-soft"
                      >
                        Return to Storefront
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
        </div>

        {/* Global Footer */}
        <Footer />

        {/* Global Floating AI Shopping Assistant */}
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;
