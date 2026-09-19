import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PartnerLockGuard from './components/PartnerLockGuard';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import ChatWidget from './components/ChatWidget';
import AdminLayout from './components/AdminLayout';
import NetworkStatus from './components/NetworkStatus';
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Login = lazy(() => import('./pages/Login'));
const SignUpPage = lazy(() => import('./pages/SignUp'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AddEditProduct = lazy(() => import('./pages/AddEditProduct'));
const MyProducts = lazy(() => import('./pages/MyProducts'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AddEditCourse = lazy(() => import('./pages/AddEditCourse'));
const MyLearning = lazy(() => import('./pages/MyLearning'));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const SellerFulfillmentQueue = lazy(() => import('./pages/SellerFulfillmentQueue'));
const ProducerDetail = lazy(() => import('./pages/ProducerDetail'));
const SellerCentre = lazy(() => import('./pages/SellerCentre'));
const FarmerCentre = lazy(() => import('./pages/FarmerCentre'));
const EducatorCentre = lazy(() => import('./pages/EducatorCentre'));
const ApplyRole = lazy(() => import('./pages/ApplyRole'));
const AdminOnboarding = lazy(() => import('./pages/AdminOnboarding'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminStores = lazy(() => import('./pages/AdminStores'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminCancellationRequests = lazy(() => import('./pages/AdminCancellationRequests'));
const DeliveryCentre = lazy(() => import('./pages/DeliveryCentre'));
const About = lazy(() => import('./pages/About'));
const Careers = lazy(() => import('./pages/Careers'));
const Help = lazy(() => import('./pages/Help'));
const Returns = lazy(() => import('./pages/Returns'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
import { UserRole } from './constants/roles';

const SELLER_ROLES = [UserRole.SELLER, UserRole.FARMER, UserRole.ARTISAN, UserRole.ADMIN];
const FARMER_ROLES = [UserRole.FARMER, UserRole.SELLER, UserRole.ARTISAN, UserRole.ADMIN];
const EDUCATOR_ROLES = [UserRole.EDUCATOR, UserRole.ADMIN];
const ADMIN_ROLES = [UserRole.ADMIN];
const DELIVERY_ROLES = [UserRole.DELIVERY_PARTNER, UserRole.ADMIN];

function App() {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <ScrollToTop />
      <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between font-body relative max-w-full overflow-x-hidden">
        <div>
          <Navbar />
          <main>
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><div className="mt-4 text-text-muted font-bold text-base">Loading...</div></div></div>}>
              <PartnerLockGuard>
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
                path="/order/:id/confirmation"
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
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
              
              {/* Delivery Partner Routes */}
              <Route
                path="/delivery-centre"
                element={
                  <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
                    <DeliveryCentre />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard & Management Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="stores" element={<AdminStores />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="cancellation-requests" element={<AdminCancellationRequests />} />
              </Route>
              <Route
                path="*"
                element={
                  <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
                    <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-3">
                      <h2 className="text-2xl font-bold font-heading text-primary">Page Not Found</h2>
                      <p className="text-sm text-text-secondary">
                        The requested page path does not exist or has been moved.
                      </p>
                      <a
                        href="/"
                        className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-soft"
                      >
                        Return to Storefront
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
            </PartnerLockGuard>
            </Suspense>
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
