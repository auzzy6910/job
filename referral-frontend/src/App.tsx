import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Referrals from "./pages/Referrals";
import SpinWheel from "./pages/SpinWheel";
import StarsPage from "./pages/Stars";
import Microtasks from "./pages/Microtasks";
import Booster from "./pages/Booster";
import Leaderboard from "./pages/Leaderboard";
import Gifts from "./pages/Gifts";
import DiamondDraw from "./pages/DiamondDraw";
import Wallet from "./pages/Wallet";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/referrals" element={<Layout><Referrals /></Layout>} />
          <Route path="/spin" element={<Layout><SpinWheel /></Layout>} />
          <Route path="/stars" element={<Layout><StarsPage /></Layout>} />
          <Route path="/microtasks" element={<Layout><Microtasks /></Layout>} />
          <Route path="/booster" element={<Layout><Booster /></Layout>} />
          <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
          <Route path="/gifts" element={<Layout><Gifts /></Layout>} />
          <Route path="/diamond" element={<Layout><DiamondDraw /></Layout>} />
          <Route path="/wallet" element={<Layout><Wallet /></Layout>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
