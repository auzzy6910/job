import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-purple-400 text-lg">Loading...</div>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (token) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
          <Route path="/spin" element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
          <Route path="/stars" element={<ProtectedRoute><StarsPage /></ProtectedRoute>} />
          <Route path="/microtasks" element={<ProtectedRoute><Microtasks /></ProtectedRoute>} />
          <Route path="/booster" element={<ProtectedRoute><Booster /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/gifts" element={<ProtectedRoute><Gifts /></ProtectedRoute>} />
          <Route path="/diamond" element={<ProtectedRoute><DiamondDraw /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
