import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Diamond, Trophy, Calendar, Users } from "lucide-react";

export default function DiamondDraw() {
  interface DiamondDrawData {
    current_month: string;
    is_entered: boolean;
    total_entries: number;
    prize: number;
    past_winners: {
      id: number;
      user_id: number;
      username: string;
      month: string;
      amount: number;
      won_at: string;
    }[];
  }
  const [data, setData] = useState<DiamondDrawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getDiamondDraw().then(setData).finally(() => setLoading(false));
  }, []);

  const handleEnter = async () => {
    setMsg("");
    try {
      const res = await api.enterDiamondDraw();
      setMsg(res.message);
      const newData = await api.getDiamondDraw();
      setData(newData);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to enter draw");
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Diamond className="text-cyan-400" /> Monthly Diamond Draw
      </h1>

      {msg && (
        <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 p-3 rounded-xl text-sm">{msg}</div>
      )}

      {/* Main Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/20 text-center">
        <Diamond size={64} className="text-cyan-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">KES 20,000</h2>
        <p className="text-gray-400 mb-1">Monthly Grand Prize</p>
        <p className="text-gray-500 text-sm mb-6">
          One lucky winner at the end of every month!
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 rounded-xl p-4">
            <Calendar size={20} className="text-purple-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Month</p>
            <p className="text-white font-semibold">{data?.current_month}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4">
            <Users size={20} className="text-blue-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Entries</p>
            <p className="text-white font-semibold">{data?.total_entries || 0}</p>
          </div>
        </div>

        {data?.is_entered ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 font-semibold">
              You're entered for this month's draw!
            </p>
            <p className="text-gray-500 text-sm mt-1">Good luck! Winner announced at month end.</p>
          </div>
        ) : (
          <button
            onClick={handleEnter}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl font-semibold transition"
          >
            Enter Diamond Draw
          </button>
        )}
      </div>

      {/* Past Winners */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          Past Winners
        </h2>
        {data?.past_winners?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No past winners yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {data?.past_winners?.map((w) => (
              <div key={w.id} className="flex justify-between items-center bg-black/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Diamond size={18} className="text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">{w.username}</p>
                    <p className="text-gray-500 text-sm">{w.month}</p>
                  </div>
                </div>
                <span className="text-yellow-400 font-bold">KES {w.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
