import { Sparkles, Repeat, PenLine, BookOpen } from 'lucide-react';
import Paraphrase from './Paraphrase';
import Writing from './Writing';
import Notebook from './Notebook';
import { SavedWord, VocabularyItem, useLocalStorage } from './lib';

type Tab = 'paraphrase' | 'writing' | 'notebook';

export default function App() {
  const [tab, setTab] = useLocalStorage<Tab>('ielts.tab', 'paraphrase');
  const [saved, setSaved] = useLocalStorage<SavedWord[]>('ielts.notebook', []);

  const toggleSave = (item: VocabularyItem) =>
    setSaved((prev) =>
      prev.some((w) => w.word.toLowerCase() === item.word.toLowerCase())
        ? prev.filter((w) => w.word.toLowerCase() !== item.word.toLowerCase())
        : [{ ...item, savedAt: Date.now() }, ...prev],
    );

  const tabs: { id: Tab; label: string; icon: typeof Repeat; badge?: number }[] = [
    { id: 'paraphrase', label: 'Paraphrase', icon: Repeat },
    { id: 'writing', label: 'Chấm Writing', icon: PenLine },
    { id: 'notebook', label: 'Sổ từ vựng', icon: BookOpen, badge: saved.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-16" id="app-root">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-4 md:px-12" id="header">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                KYSUPHANMEMTUAN
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
                  IELTS C1/C2
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Paraphrase, chấm Writing và luyện từ vựng học thuật</p>
            </div>
          </div>

          <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto" role="tablist">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {!!badge && <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5">{badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {tab === 'paraphrase' && <Paraphrase saved={saved} onToggleSave={toggleSave} />}
      {tab === 'writing' && <Writing />}
      {tab === 'notebook' && <Notebook saved={saved} setSaved={setSaved} />}
    </div>
  );
}
