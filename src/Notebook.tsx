import { useMemo, useState } from 'react';
import { BookOpen, Download, Layers, Trash2, Volume2, RotateCcw, Check, X, Search } from 'lucide-react';
import { SavedWord, speak, toCsv } from './lib';

interface Props {
  saved: SavedWord[];
  setSaved: (update: (prev: SavedWord[]) => SavedWord[]) => void;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Flashcards({ words, onMark, onExit }: { words: SavedWord[]; onMark: (word: string, known: boolean) => void; onExit: () => void }) {
  const [deck] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck[index];

  const next = (known: boolean) => {
    onMark(card.word, known);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  if (!card) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center gap-3">
        <Check className="w-10 h-10 text-emerald-500" />
        <h3 className="font-bold text-slate-800">Xong {deck.length} thẻ!</h3>
        <button onClick={onExit} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">Quay lại sổ từ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between text-xs text-slate-500">
        <button onClick={onExit} className="font-semibold hover:text-slate-800 cursor-pointer">← Thoát</button>
        <span>{index + 1} / {deck.length}</span>
      </div>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full max-w-lg min-h-64 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-indigo-200 transition-all"
        aria-label={flipped ? 'Ẩn nghĩa' : 'Xem nghĩa'}
      >
        {!flipped ? (
          <>
            <span className="text-2xl font-bold text-slate-900">{card.word}</span>
            {card.ipa && <span className="text-sm text-slate-400 font-mono">{card.ipa}</span>}
            <span className="text-[11px] text-slate-400 mt-4">Bấm để xem nghĩa</span>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-slate-400">{card.type} · {card.level}</span>
            <span className="text-lg font-semibold text-indigo-700">{card.meaning}</span>
            {card.example && <span className="text-sm text-slate-500 italic">“{card.example}”</span>}
          </>
        )}
      </button>
      <div className="flex gap-3">
        <button onClick={() => speak(card.word)} className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 cursor-pointer" aria-label="Nghe phát âm">
          <Volume2 className="w-4 h-4" />
        </button>
        <button onClick={() => next(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold cursor-pointer">
          <RotateCcw className="w-4 h-4" /> Chưa nhớ
        </button>
        <button onClick={() => next(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold cursor-pointer">
          <Check className="w-4 h-4" /> Đã nhớ
        </button>
      </div>
    </div>
  );
}

export default function Notebook({ saved, setSaved }: Props) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  const [onlyUnknown, setOnlyUnknown] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return saved.filter((w) => (!onlyUnknown || !w.known) && (!q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)));
  }, [saved, query, onlyUnknown]);

  const knownCount = saved.filter((w) => w.known).length;

  const exportCsv = () => {
    // BOM so Excel opens Vietnamese text as UTF-8
    const blob = new Blob(['﻿' + toCsv(saved)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ielts-vocabulary.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const mark = (word: string, known: boolean) => setSaved((prev) => prev.map((w) => (w.word === word ? { ...w, known } : w)));

  if (saved.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center text-center gap-3">
          <BookOpen className="w-8 h-8 text-slate-300" />
          <h3 className="font-bold text-slate-700 text-sm">Sổ từ vựng đang trống</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Ở tab Paraphrase, bấm ☆ cạnh từ trong phần "Phân tích từ vựng" để lưu vào đây và luyện bằng flashcard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 mt-6 flex flex-col gap-4" id="notebook">
      {mode === 'cards' ? (
        <Flashcards words={filtered} onMark={mark} onExit={() => setMode('list')} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-slate-900">Sổ từ vựng</h2>
              <p className="text-xs text-slate-500">{saved.length} từ · đã nhớ {knownCount}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('cards')}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" /> Luyện flashcard
              </button>
              <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm từ hoặc nghĩa..."
                className="flex-1 py-2 text-sm focus:outline-none bg-transparent"
                aria-label="Tìm trong sổ từ"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 px-2">
              <input type="checkbox" checked={onlyUnknown} onChange={(e) => setOnlyUnknown(e.target.checked)} />
              Chỉ từ chưa nhớ
            </label>
          </div>

          <ul className="flex flex-col gap-2">
            {filtered.map((w) => (
              <li key={w.word} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{w.word}</span>
                    {w.ipa && <span className="text-[11px] text-slate-400 font-mono">{w.ipa}</span>}
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded">{w.type}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded">{w.level}</span>
                    {w.known && <span className="text-[10px] font-semibold text-emerald-600">✓ đã nhớ</span>}
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{w.meaning}</p>
                  {w.example && <p className="text-[11px] text-slate-500 italic mt-0.5">“{w.example}”</p>}
                </div>
                <button onClick={() => speak(w.word)} className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer" aria-label={`Nghe ${w.word}`}>
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSaved((prev) => prev.filter((x) => x.word !== w.word))}
                  className="p-1.5 text-slate-300 hover:text-rose-600 cursor-pointer"
                  aria-label={`Xoá ${w.word}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-center text-xs text-slate-400 py-6 flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> Không có từ nào khớp.
              </li>
            )}
          </ul>
        </>
      )}
    </main>
  );
}
