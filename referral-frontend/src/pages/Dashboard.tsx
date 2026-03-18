import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useState } from "react";
import {
  Wallet, Users, Star, Lock, Shield, TrendingUp, Copy, Check
} from "lucide-react";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [activating, setActivating] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    setMsg("");
    try {
      const res = await api.activate();
      setMsg(res.message);
      await refreshUser();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setActivating(false);
    }
  };

  const referralLink = `${window.location.origin}/signup?ref=${user?.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, {user?.username}!
        </h1>
        <p className="text-gray-400 mt-1">Here's your earning overview</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Wallet size={20} className="text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Balance</span>
          </div>
          <p className="text-2xl font-bold text-white">KES {user?.balance?.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Lock size={20} className="text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">Locked Bonus</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">KES {user?.locked_bonus?.toFixed(2)}</p>
          {(user?.locked_bonus ?? 0) > 0 && (
            <p className="text-xs text-gray-500 mt-1">Invite someone to unlock</p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users size={20} className="text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Referrals</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.total_referrals || 0}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-white">KES {user?.total_earned?.toFixed(2) || "0.00"}</p>
        </div>
      </div>

      {/* Activation Card */}
      {!user?.is_activated && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={24} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Activate Your Account</h2>
          </div>
          <p className="text-gray-300 mb-4">
            Pay <strong>50 KES</strong> activation fee to unlock microtasks, diamond draw, and more earning features!
          </p>
          {msg && <p className="text-sm text-yellow-300 mb-3">{msg}</p>}
          <button
            onClick={handleActivate}
            disabled={activating}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-semibold rounded-xl transition disabled:opacity-50"
          >
            {activating ? "Activating..." : "Activate (50 KES)"}
          </button>
        </div>
      )}

      {/* Referral Link */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <Star size={20} className="text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Your Referral Link</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Share this link to earn! First referral: <strong className="text-yellow-400">200 KES</strong>, then <strong className="text-green-400">100 KES</strong> per referral.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-2.5 bg-black/30 border border-purple-500/20 rounded-xl text-gray-300 text-sm"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2.5 bg-purple-500/30 hover:bg-purple-500/50 text-white rounded-xl transition flex items-center gap-2"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Code: <span className="text-purple-400 font-mono">{user?.referral_code}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-400 font-bold mb-2">1</div>
            <h3 className="text-white font-medium mb-1">Sign Up & Activate</h3>
            <p className="text-gray-400 text-sm">Pay 50 KES activation fee to unlock all features</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-400 font-bold mb-2">2</div>
            <h3 className="text-white font-medium mb-1">Invite Friends</h3>
            <p className="text-gray-400 text-sm">Share your link. Earn 200 KES on first referral, 100 KES after</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-400 font-bold mb-2">3</div>
            <h3 className="text-white font-medium mb-1">Earn Daily</h3>
            <p className="text-gray-400 text-sm">Spin wheel, collect stars, do microtasks & boost earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
