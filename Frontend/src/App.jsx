import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MusicProvider } from "./context/MusicContext";

import CreatePost from "./pages/CreatePost";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Music from "./pages/Music";
import Upload from "./pages/Upload";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Player from "./components/Player";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Feed />
            </PageWrapper>
          }
        />
        <Route
          path="/music"
          element={
            <PageWrapper>
              <Music />
            </PageWrapper>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <CreatePost />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Upload />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        <Route
          path="/register"
          element={
            <PageWrapper>
              <Register />
            </PageWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Profile />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <Header />
          <main>
            <AnimatedRoutes />
          </main>
          <Footer />
          <Player />
        </Router>
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
