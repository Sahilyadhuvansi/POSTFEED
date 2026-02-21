import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MusicProvider } from "./context/MusicContext";
import {
  PageReadinessProvider,
  usePageReadiness,
} from "./context/PageReadinessContext";

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

/**
 * Detects route changes and marks app as navigating
 * This allows keeping old page visible while new page loads
 */
const RouteChangeDetector = () => {
  const location = useLocation();
  const { markNavigating } = usePageReadiness();

  useEffect(() => {
    markNavigating(location.pathname);
  }, [location.pathname, markNavigating]);

  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <PageReadinessProvider>
          <Router>
            <RouteChangeDetector />
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/music" element={<Music />} />
                <Route
                  path="/create-post"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <Upload />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <Player />
          </Router>
        </PageReadinessProvider>
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
