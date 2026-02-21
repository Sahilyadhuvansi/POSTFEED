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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
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
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
