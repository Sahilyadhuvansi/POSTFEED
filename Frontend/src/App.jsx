import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreatePost from "./pages/CreatePost";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import Header from "./components/Header";
import Footer from "./components/Footer";

const App = () => {
  return (
    <Router>
      <Header />
      <main className="content-wrapper">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
