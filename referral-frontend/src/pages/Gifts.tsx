import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Gift, ArrowUp, ArrowDown, Star, Coins } from "lucide-react";

export default function Gifts() {
  const { refreshUser } = useAuth();
  const [giftData, setGiftData] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.getGiftDashboard(),
      api.getDailyCredits(),
    ]).then(([g, c]) => {
      setGiftData(g);
      setCredits(c);
    }).finally(() => setLoading(false));
  }, []);

  const handleClaimCredits = async () => {
    setMsg("");
    try {
      const res = await api.claimDailyCredits();
      setMsg(res.message);
      await refreshUser();
      const c = await api.getDailyCredits();
      setCredits(c);
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Gift className="text-pink-400" /> Gifts & Credits
      </h1>

      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm">{msg}</div>
      )}

      {/* Daily Free Credits */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={20} className="text-green-400" />
          <h2 className="text-white font-semibold">Daily Free Credits</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Claim your free daily credits (1-10 KES)! Available once per day.
        </p>
        {credits?.claimed_today ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400">
              Already claimed today! You received <strong>{credits.credit?.amount} KES</strong>.
            </p>
          </div>
        ) : (
          <button
            onClick={handleClaimCredits}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Gift size={18} />
            Claim Daily Credits
          </button>
        )}
      </div>

      {/* Gift Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20 text-center">
          <ArrowUp size={24} className="text-pink-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Stars Sent</p>
          <p className="text-2xl font-bold text-white mt-1">KES {giftData?.total_sent || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20 text-center">
          <ArrowDown size={24} className="text-green-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Stars Received</p>
          <p className="text-2xl font-bold text-white mt-1">KES {giftData?.total_received || 0}</p>
        </div>
      </div>

      {/* Received Gifts */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <ArrowDown size={18} className="text-green-400" />
          Received Gifts
        </h2>
        {giftData?.received?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No gifts received yet</p>
        ) : (
          <div className="space-y-2">
            {giftData?.received?.map((g: any) => (
              <div key={g.id} className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" />
                  <span className="text-gray-300">From <strong className="text-white">{g.sender_name}</strong></span>
                </div>
                <span className="text-green-400 font-semibold">+{g.star_value} KES</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Gifts */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <ArrowUp size={18} className="text-pink-400" />
          Sent Gifts
        </h2>
        {giftData?.sent?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No gifts sent yet</p>
        ) : (
          <div className="space-y-2">
            {giftData?.sent?.map((g: any) => (
              <div key={g.id} className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-pink-400" />
                  <span className="text-gray-300">To <strong className="text-white">{g.receiver_name}</strong></span>
                </div>
                <span className="text-pink-400 font-semibold">-{g.star_value} KES</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
