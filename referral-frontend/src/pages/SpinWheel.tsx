import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { RotateCw, Trophy, Clock } from "lucide-react";

export default function SpinWheel() {
  const { refreshUser } = useAuth();
  interface SpinRecord {
    id: number;
    user_id: number;
    amount: number;
    spun_at: string;
  }
  interface SpinStatus {
    can_spin: boolean;
    last_spin: SpinRecord | null;
    history: SpinRecord[];
    amounts: number[];
  }
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [loading, setLoading] = useState(true);

  const amounts = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 1];
  const colors = [
    "#6B21A8", "#7C3AED", "#8B5CF6", "#A78BFA",
    "#C084FC", "#D946EF", "#EC4899", "#F43F5E",
    "#FB923C", "#FBBF24", "#34D399", "#60A5FA"
  ];

  useEffect(() => {
    api.spinStatus().then(setStatus).finally(() => setLoading(false));
  }, []);

  const handleSpin = async () => {
    setSpinning(true);
    setResult(null);
    try {
      const res = await api.spinWheel();
      const idx = amounts.indexOf(res.amount);
      const segAngle = 360 / amounts.length;
      const targetAngle = 360 * 5 + (360 - idx * segAngle - segAngle / 2);
      setAngle(targetAngle);

      setTimeout(async () => {
        setResult(res.amount);
        setSpinning(false);
        await refreshUser();
        const newStatus = await api.spinStatus();
        setStatus(newStatus);
      }, 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Spin failed");
      setSpinning(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <RotateCw className="text-purple-400" /> Spin Wheel
      </h1>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
        <div className="flex flex-col items-center">
          {/* Wheel */}
          <div className="relative w-72 h-72 mb-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-yellow-400" />
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-2xl"
              style={{
                transform: `rotate(${angle}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              {amounts.map((amount, i) => {
                const segAngle = 360 / amounts.length;
                const startAngle = i * segAngle;
                const endAngle = (i + 1) * segAngle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 100 + 95 * Math.cos(startRad);
                const y1 = 100 + 95 * Math.sin(startRad);
                const x2 = 100 + 95 * Math.cos(endRad);
                const y2 = 100 + 95 * Math.sin(endRad);
                const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
                const textX = 100 + 65 * Math.cos(midRad);
                const textY = 100 + 65 * Math.sin(midRad);
                const textAngle = (startAngle + endAngle) / 2;

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A95,95 0 0,1 ${x2},${y2} Z`}
                      fill={colors[i % colors.length]}
                      stroke="#1a1a2e"
                      strokeWidth="1"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    >
                      {amount}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="15" fill="#1a1a2e" stroke="#7C3AED" strokeWidth="2" />
              <text x="100" y="100" fill="white" fontSize="6" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                KES
              </text>
            </svg>
          </div>

          {/* Result */}
          {result !== null && (
            <div className={`mb-4 p-4 rounded-xl text-center ${
              result > 0
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-gray-500/10 border border-gray-500/30"
            }`}>
              <Trophy size={24} className={result > 0 ? "text-yellow-400 mx-auto mb-2" : "text-gray-400 mx-auto mb-2"} />
              <p className="text-xl font-bold text-white">
                {result > 0 ? `You won ${result} KES!` : "Better luck next time!"}
              </p>
            </div>
          )}

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || status?.can_spin === false}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCw size={18} className={spinning ? "animate-spin" : ""} />
            {spinning ? "Spinning..." : status?.can_spin === false ? "Already Spun Today" : "Spin Now!"}
          </button>

          {status?.can_spin === false && (
            <p className="text-gray-500 text-sm mt-3 flex items-center gap-1">
              <Clock size={14} /> Come back tomorrow for another spin!
            </p>
          )}
        </div>
      </div>

      {/* History */}
      {status && status.history.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-4">Spin History</h2>
          <div className="space-y-2">
            {status.history.map((h) => (
              <div key={h.id} className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <span className="text-gray-400 text-sm">{new Date(h.spun_at).toLocaleDateString()}</span>
                <span className={`font-semibold ${h.amount > 0 ? "text-green-400" : "text-gray-500"}`}>
                  {h.amount > 0 ? `+${h.amount} KES` : "0 KES"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
