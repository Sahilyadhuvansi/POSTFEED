import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return children;
};

/**
 * Simple routing - pages show skeleton loaders during data loading
 * Smooth content fill-in as data arrives
 */
const AppRouter = () => {
  return (
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
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <ErrorBoundary>
            <Header />
            <main>
              <AppRouter />
            </main>
            <Footer />
            <Player />
          </ErrorBoundary>
        </Router>
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
