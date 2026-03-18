import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Star, Gift, Clock, Send } from "lucide-react";

export default function StarsPage() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [giftUser, setGiftUser] = useState("");
  const [giftValue, setGiftValue] = useState(1);
  const [gifting, setGifting] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await api.starStatus();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCollect = async () => {
    setMsg("");
    try {
      const res = await api.collectStar();
      setMsg(res.message);
      await loadStatus();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const handleClaim = async () => {
    setMsg("");
    try {
      const res = await api.claimStars();
      setMsg(res.message);
      await refreshUser();
      await loadStatus();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const handleGift = async () => {
    if (!giftUser) return;
    setGifting(true);
    setMsg("");
    try {
      const res = await api.giftStar(giftUser, giftValue);
      setMsg(res.message);
      setGiftUser("");
      await refreshUser();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setGifting(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Star className="text-yellow-400" /> Daily Stars
      </h1>

      {msg && (
        <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 p-3 rounded-xl text-sm">
          {msg}
        </div>
      )}

      {/* Collect Star */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-2">Collect Daily Star</h2>
        <p className="text-gray-400 text-sm mb-4">
          Collect a star worth <strong className="text-yellow-400">1-5 KES</strong> every day.
          Stars expire after <strong className="text-red-400">3 hours</strong>!
        </p>

        {status?.collected_today ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Star size={20} fill="currentColor" />
              <span className="font-semibold">Today's Star: {status.today_star?.value} KES</span>
            </div>
            {status.today_star && !status.today_star.claimed && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock size={14} />
                Expires: {new Date(status.today_star.expires_at).toLocaleTimeString()}
              </div>
            )}
            {status.today_star?.claimed && (
              <p className="text-green-400 text-sm">Already claimed!</p>
            )}
          </div>
        ) : (
          <button
            onClick={handleCollect}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-semibold rounded-xl transition flex items-center gap-2"
          >
            <Star size={18} />
            Collect Star
          </button>
        )}
      </div>

      {/* Claim Stars */}
      {status?.unclaimed_stars?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-green-500/20">
          <h2 className="text-white font-semibold mb-3">Unclaimed Stars</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {status.unclaimed_stars.map((s: any) => (
              <div key={s.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                <span className="text-yellow-300 font-semibold">{s.value} KES</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleClaim}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition"
          >
            Claim All Stars
          </button>
        </div>
      )}

      {/* Gift Star */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Gift size={20} className="text-pink-400" />
          <h2 className="text-white font-semibold">Gift a Star</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">Send stars to other users as gifts (deducted from your balance)</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={giftUser}
            onChange={(e) => setGiftUser(e.target.value)}
            placeholder="Recipient username"
            className="flex-1 px-4 py-2.5 bg-black/30 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
          />
          <select
            value={giftValue}
            onChange={(e) => setGiftValue(Number(e.target.value))}
            className="px-4 py-2.5 bg-black/30 border border-purple-500/20 rounded-xl text-white focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v} className="bg-gray-900">{v} KES</option>
            ))}
          </select>
          <button
            onClick={handleGift}
            disabled={gifting || !giftUser}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-500 hover:from-pink-500 hover:to-purple-400 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
            {gifting ? "Sending..." : "Send Gift"}
          </button>
        </div>
      </div>

      {/* Star History */}
      {status?.history?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-4">Star History</h2>
          <div className="space-y-2">
            {status.history.map((h: any) => (
              <div key={h.id} className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" fill={h.claimed ? "currentColor" : "none"} />
                  <span className="text-gray-400 text-sm">
                    {new Date(h.collected_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-300 font-semibold">{h.value} KES</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    h.claimed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {h.claimed ? "Claimed" : "Expired"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
