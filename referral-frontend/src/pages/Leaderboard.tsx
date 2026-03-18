import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Crown, Trophy, Medal } from "lucide-react";

export default function Leaderboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  const positionIcons = [
    <Crown size={24} className="text-yellow-400" />,
    <Trophy size={24} className="text-gray-300" />,
    <Medal size={24} className="text-orange-400" />,
  ];

  const positionColors = [
    "border-yellow-500/30 bg-yellow-500/5",
    "border-gray-400/30 bg-gray-400/5",
    "border-orange-500/30 bg-orange-500/5",
    "border-purple-500/20 bg-white/5",
    "border-purple-500/20 bg-white/5",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Crown className="text-yellow-400" /> Royal Crown Leaderboard
      </h1>

      <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
        <h2 className="text-white font-semibold mb-2">Royal Crown Prizes</h2>
        <p className="text-gray-400 text-sm mb-4">
          Top 5 users with the highest referrals win monthly prizes!
        </p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data?.prizes || {}).map(([pos, prize]) => (
            <div key={pos} className="bg-black/20 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-yellow-400 font-bold">#{pos}</span>
              <span className="text-white font-semibold">KES {String(prize)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data?.leaderboard?.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-purple-500/20 text-center">
            <Crown size={48} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No referrals yet. Be the first to climb the leaderboard!</p>
          </div>
        ) : (
          data?.leaderboard?.map((entry: any, i: number) => (
            <div
              key={i}
              className={`backdrop-blur-md rounded-2xl p-5 border ${positionColors[i] || positionColors[4]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                    {i < 3 ? positionIcons[i] : (
                      <span className="text-gray-400 font-bold text-lg">#{entry.position}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{entry.username}</p>
                    <p className="text-gray-400 text-sm">{entry.referral_count} referrals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold text-lg">KES {entry.crown_prize}</p>
                  <p className="text-gray-500 text-xs">Crown Prize</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
