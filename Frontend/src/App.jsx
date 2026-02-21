import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MusicProvider } from "./context/MusicContext";
import { PageLoadProvider, usePageLoad } from "./context/PageLoadContext";

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

const AppRouter = () => {
  const location = useLocation();
  const { isPageReady, nextPageReady, resetPageState, allowPageSwitch } =
    usePageLoad();
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    // When location changes, signal page is not ready
    if (displayLocation.pathname !== location.pathname) {
      resetPageState();
    }
  }, [location, displayLocation, resetPageState]);

  // When next page is ready, switch to it
  useEffect(() => {
    if (nextPageReady && !isPageReady) {
      allowPageSwitch();
      setDisplayLocation(location);
    }
  }, [nextPageReady, isPageReady, allowPageSwitch, location]);

  return (
    <>
      <Header />
      <main>
        <Routes location={displayLocation}>
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
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <PageLoadProvider>
          <Router>
            <AppRouter />
          </Router>
        </PageLoadProvider>
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
