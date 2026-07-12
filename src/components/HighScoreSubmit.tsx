import React, { useState } from 'react';
import { saveHighScore } from '../utils/firebase';

interface HighScoreSubmitProps {
  score: number;
  level: number;
  onClose: () => void;
}

export const HighScoreSubmit: React.FC<HighScoreSubmitProps> = ({ score, level, onClose }) => {
  const [name, setName] = useState(() => localStorage.getItem('fatPrincePlayerName') || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    localStorage.setItem('fatPrincePlayerName', name.trim());
    const success = await saveHighScore(name.trim(), score, level);

    setSubmitting(false);
    if (success) {
      setSubmitted(true);
    } else {
      setError('Failed to submit score. Please try again!');
    }
  };

  return (
    <div className="bg-slate-900 border-4 border-yellow-400 p-6 rounded-2xl w-full max-w-sm mx-auto shadow-2xl text-center text-white my-4 relative">
      <h3 className="text-xl font-black text-yellow-400 tracking-wider mb-2">SUBMIT HIGH SCORE</h3>
      
      <div className="bg-slate-950/80 rounded-xl py-3 px-4 border border-slate-800 mb-4 flex justify-around">
        <div>
          <div className="text-[10px] text-gray-500 font-bold uppercase">Score</div>
          <div className="text-xl font-black text-green-400">{score.toLocaleString()}</div>
        </div>
        <div className="border-l border-slate-800" />
        <div>
          <div className="text-[10px] text-gray-500 font-bold uppercase">Level</div>
          <div className="text-xl font-black text-pink-400">{level}</div>
        </div>
      </div>

      {submitted ? (
        <div className="py-4">
          <div className="text-4xl mb-2">👑</div>
          <p className="text-green-400 font-black mb-4">SCORE SUBMITTED SUCCESSFULLY!</p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded-full transition-all active:scale-95"
          >
            CONTINUE
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 text-left mb-1 uppercase">
              Enter Your Name:
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="Gyuuun Knight"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-bold placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-all text-center"
            />
          </div>

          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl transition-all active:scale-95 text-sm"
            >
              SKIP
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-2.5 bg-gradient-to-b from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-yellow-950 font-black rounded-xl shadow-[0_4px_0_#a16207] active:shadow-none active:translate-y-1 transition-all text-sm"
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
