import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Wallet as WalletIcon, ArrowDown, ArrowUp, Clock } from "lucide-react";

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  interface Transaction {
    id: number;
    user_id: number;
    amount: number;
    type: string;
    description: string;
    created_at: string;
  }
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getTransactions().then(setTransactions).finally(() => setLoading(false));
  }, []);

  const handleDeposit = async () => {
    if (!depositAmt || Number(depositAmt) <= 0) return;
    setMsg("");
    try {
      const res = await api.deposit(Number(depositAmt));
      setMsg(res.message);
      setDepositAmt("");
      await refreshUser();
      const txns = await api.getTransactions();
      setTransactions(txns);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt || Number(withdrawAmt) <= 0) return;
    setMsg("");
    try {
      const res = await api.withdraw(Number(withdrawAmt));
      setMsg(res.message);
      setWithdrawAmt("");
      await refreshUser();
      const txns = await api.getTransactions();
      setTransactions(txns);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  const typeColors: Record<string, string> = {
    deposit: "text-green-400",
    withdrawal: "text-red-400",
    signup_bonus: "text-yellow-400",
    activation_fee: "text-orange-400",
    referral_bonus: "text-purple-400",
    spin_wheel: "text-pink-400",
    star_claim: "text-yellow-400",
    star_gift_sent: "text-pink-400",
    star_gift_received: "text-green-400",
    microtask: "text-blue-400",
    booster_deposit: "text-orange-400",
    booster_withdraw: "text-green-400",
    daily_credit: "text-emerald-400",
    diamond_draw: "text-cyan-400",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <WalletIcon className="text-green-400" /> Wallet
      </h1>

      {msg && (
        <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 p-3 rounded-xl text-sm">{msg}</div>
      )}

      {/* Balance */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20 text-center">
        <p className="text-gray-400 mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-white">KES {user?.balance?.toFixed(2)}</p>
        {(user?.locked_bonus ?? 0) > 0 && (
          <p className="text-yellow-400 text-sm mt-2">+ KES {user?.locked_bonus?.toFixed(2)} locked</p>
        )}
      </div>

      {/* Deposit & Withdraw */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ArrowDown size={18} className="text-green-400" /> Deposit
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={depositAmt}
              onChange={(e) => setDepositAmt(e.target.value)}
              placeholder="Amount (KES)"
              className="flex-1 px-4 py-2.5 bg-black/30 border border-purple-500/20 rounded-xl text-white focus:outline-none"
            />
            <button
              onClick={handleDeposit}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-medium transition hover:from-green-500"
            >
              Deposit
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ArrowUp size={18} className="text-red-400" /> Withdraw
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmt}
              onChange={(e) => setWithdrawAmt(e.target.value)}
              placeholder="Amount (KES)"
              className="flex-1 px-4 py-2.5 bg-black/30 border border-purple-500/20 rounded-xl text-white focus:outline-none"
            />
            <button
              onClick={handleWithdraw}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium transition hover:from-red-500"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" /> Recent Transactions
        </h2>
        {loading ? (
          <p className="text-gray-500 text-center py-4">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between bg-black/20 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    txn.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"
                  }`}>
                    {txn.amount > 0 ? (
                      <ArrowDown size={14} className="text-green-400" />
                    ) : (
                      <ArrowUp size={14} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{txn.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${typeColors[txn.type] || "text-white"}`}>
                  {txn.amount > 0 ? "+" : ""}{txn.amount} KES
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
