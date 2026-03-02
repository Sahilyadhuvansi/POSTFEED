import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { MusicProvider } from "./features/music/MusicContext";

// Pages
import CreatePost from "./features/posts/CreatePost";
import Feed from "./features/posts/Feed";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import Profile from "./features/users/Profile";
import Music from "./features/music/Music";
import Upload from "./features/music/Upload";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import Player from "./features/music/Player";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

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
    <ErrorBoundary>
      <AuthProvider>
        <MusicProvider>
          <Router>
            <Header />
            <main>
              <AppRouter />
            </main>
            <Footer />
            <Player />
          </Router>
        </MusicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
