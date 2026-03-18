import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ListChecks, CheckCircle, Circle, Lock, DollarSign } from "lucide-react";

export default function Microtasks() {
  const { user, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadTasks = async () => {
    try {
      const data = await api.getMicrotasks();
      setTasks(data.tasks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId: number) => {
    setMsg("");
    try {
      const res = await api.completeTask(taskId);
      setMsg(res.message);
      await refreshUser();
      await loadTasks();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  if (!user?.is_activated) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ListChecks className="text-purple-400" /> Microtasks
        </h1>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-center">
          <Lock size={48} className="text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Account Not Activated</h2>
          <p className="text-gray-400 mb-4">
            You need to activate your account (50 KES) to access microtasks and earn rewards.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <ListChecks className="text-purple-400" /> Microtasks
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">{error}</div>
      )}
      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm">{msg}</div>
      )}

      <p className="text-gray-400 text-sm">
        Complete tasks to earn rewards. Each task can only be completed once.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white/5 backdrop-blur-md rounded-2xl p-5 border ${
              task.completed ? "border-green-500/20" : "border-purple-500/20"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {task.completed ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <Circle size={20} className="text-gray-500" />
                )}
                <h3 className="text-white font-semibold">{task.title}</h3>
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                <DollarSign size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">{task.reward} KES</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">{task.description}</p>
            {task.completed ? (
              <span className="text-green-400 text-sm font-medium">Completed</span>
            ) : (
              <button
                onClick={() => handleComplete(task.id)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-sm font-medium transition"
              >
                Complete Task
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
