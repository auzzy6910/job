import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Users, Copy, Check, UserCheck, Clock, DollarSign } from "lucide-react";

export default function Referrals() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getReferrals().then(setData).finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}/signup?ref=${data?.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Users className="text-purple-400" /> Referrals
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-purple-500/20 text-center">
          <p className="text-gray-400 text-sm">Total Referrals</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.stats?.total || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-purple-500/20 text-center">
          <p className="text-gray-400 text-sm">Deposits Made</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{data?.stats?.deposits_made || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-purple-500/20 text-center">
          <p className="text-gray-400 text-sm">Bonuses Paid</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{data?.stats?.bonuses_paid || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-purple-500/20 text-center">
          <p className="text-gray-400 text-sm">Total Earned</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">KES {data?.stats?.total_earned || 0}</p>
        </div>
      </div>

      {/* Locked Bonus */}
      {(data?.locked_bonus ?? 0) > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
          <p className="text-yellow-300">
            You have <strong>KES {data.locked_bonus}</strong> locked bonus.
            Invite someone who deposits 200 KES to unlock it!
          </p>
        </div>
      )}

      {/* Referral Link */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-3">Share Your Referral Link</h2>
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
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {data?.first_referral_completed
            ? "You earn 100 KES per referral"
            : "First referral unlocks 200 KES bonus!"}
        </p>
      </div>

      {/* Referral List */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-4">Your Referrals</h2>
        {data?.referrals?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No referrals yet. Share your link to start earning!</p>
        ) : (
          <div className="space-y-3">
            {data?.referrals?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between bg-black/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    r.bonus_paid ? "bg-green-500/20" : "bg-gray-500/20"
                  }`}>
                    <UserCheck size={18} className={r.bonus_paid ? "text-green-400" : "text-gray-400"} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{r.referred_username}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {r.bonus_paid ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <DollarSign size={14} />
                      <span className="font-semibold">+{r.amount_paid} KES</span>
                    </div>
                  ) : r.deposit_made ? (
                    <span className="text-yellow-400 text-sm">Processing</span>
                  ) : (
                    <span className="text-gray-500 text-sm">Awaiting deposit</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
