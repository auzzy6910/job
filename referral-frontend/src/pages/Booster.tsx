import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Rocket, Clock, ArrowDown, ArrowUp } from "lucide-react";

export default function Booster() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadStatus = async () => {
    try {
      const data = await api.boosterStatus();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDeposit = async () => {
    setMsg("");
    try {
      const res = await api.boosterDeposit();
      setMsg(res.message);
      await refreshUser();
      await loadStatus();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const handleWithdraw = async () => {
    setMsg("");
    try {
      const res = await api.boosterWithdraw();
      setMsg(res.message);
      await refreshUser();
      await loadStatus();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Rocket className="text-orange-400" /> Booster
      </h1>

      {msg && (
        <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 p-3 rounded-xl text-sm">{msg}</div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20">
        <h2 className="text-white font-semibold mb-2">How Booster Works</h2>
        <ul className="text-gray-300 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <ArrowDown size={16} className="text-orange-400 mt-0.5" />
            Deposit <strong>200 KES</strong> into the booster
          </li>
          <li className="flex items-start gap-2">
            <Clock size={16} className="text-yellow-400 mt-0.5" />
            Wait <strong>24 hours</strong> for the booster to mature
          </li>
          <li className="flex items-start gap-2">
            <ArrowUp size={16} className="text-green-400 mt-0.5" />
            Withdraw your <strong>200 KES</strong> back after 24 hours
          </li>
        </ul>
      </div>

      {/* Active Booster */}
      {status?.has_active_booster ? (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Rocket size={20} className="text-green-400" />
            <h2 className="text-white font-semibold">Active Booster</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Amount</p>
              <p className="text-xl font-bold text-white">{status.active_booster.amount} KES</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`text-xl font-bold ${status.active_booster.can_withdraw ? "text-green-400" : "text-yellow-400"}`}>
                {status.active_booster.can_withdraw ? "Ready" : "Maturing"}
              </p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm">Deposited</p>
            <p className="text-gray-300 text-sm">{new Date(status.active_booster.deposited_at).toLocaleString()}</p>
            <p className="text-gray-400 text-sm mt-2">Withdrawable After</p>
            <p className="text-gray-300 text-sm">{new Date(status.active_booster.withdrawable_at).toLocaleString()}</p>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!status.active_booster.can_withdraw}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowUp size={18} />
            {status.active_booster.can_withdraw ? "Withdraw 200 KES" : "Not Yet Withdrawable"}
          </button>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20 text-center">
          <Rocket size={48} className="text-orange-400 mx-auto mb-4" />
          <h2 className="text-white font-semibold mb-2">No Active Booster</h2>
          <p className="text-gray-400 text-sm mb-4">
            Deposit 200 KES to start a booster. You can withdraw after 24 hours.
          </p>
          <button
            onClick={handleDeposit}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-semibold rounded-xl transition flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowDown size={18} />
            Deposit 200 KES
          </button>
        </div>
      )}

      {/* History */}
      {status?.history?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-4">Booster History</h2>
          <div className="space-y-2">
            {status.history.map((h: any) => (
              <div key={h.id} className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <span className="text-gray-400 text-sm">{new Date(h.deposited_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{h.amount} KES</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    h.withdrawn ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {h.withdrawn ? "Withdrawn" : "Active"}
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
