import { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  TrendingUp,
  FileText,
  Volume2,
  Star,
  History,
  X
} from 'lucide-react';
import { VocabularyItem, SavedWord, useLocalStorage, speak, postJson } from './lib';

const TOPICS: { label: string; text: string }[] = [
  { label: 'Education', text: 'Students should learn practical skills at school.' },
  { label: 'Environment', text: 'Pollution is a big problem in many cities.' },
  { label: 'Technology', text: 'Technology makes our life easier.' },
  { label: 'Health', text: 'People should do more exercise to stay healthy.' },
  { label: 'Work', text: 'Many young people want to work from home.' },
  { label: 'Tiếng Việt', text: 'Chính phủ nên đầu tư nhiều hơn vào giao thông công cộng.' },
  { label: 'Từ đơn', text: 'important' },
];

const HISTORY_LIMIT = 20;

interface Props {
  saved: SavedWord[];
  onToggleSave: (item: VocabularyItem) => void;
}

interface ParaphraseResult {
  original: string;
  original_vietnamese?: string;
  b2: string;
  b2_vietnamese?: string;
  c1: string;
  c1_vietnamese?: string;
  c1_plus: string;
  c1_plus_vietnamese?: string;
  c2: string;
  c2_vietnamese?: string;
  vocabulary?: VocabularyItem[];
  timestamp: number;
  inputSource: string;
}

export default function Paraphrase({ saved, onToggleSave }: Props) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParaphraseResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<ParaphraseResult[]>('ielts.history', []);
  const isSaved = (word: string) => saved.some((w) => w.word.toLowerCase() === word.toLowerCase());

  const handleParaphrase = async (textToSubmit: string) => {
    if (!textToSubmit || textToSubmit.trim() === '') return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await postJson<any>('/api/paraphrase', { text: textToSubmit.trim() });
      
      const newResult: ParaphraseResult = {
        original: data.original,
        original_vietnamese: data.original_vietnamese,
        b2: data.b2,
        b2_vietnamese: data.b2_vietnamese,
        c1: data.c1,
        c1_vietnamese: data.c1_vietnamese,
        c1_plus: data.c1_plus,
        c1_plus_vietnamese: data.c1_plus_vietnamese,
        c2: data.c2,
        c2_vietnamese: data.c2_vietnamese,
        vocabulary: data.vocabulary || [],
        timestamp: Date.now(),
        inputSource: textToSubmit.trim()
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.filter((h) => h.inputSource !== newResult.inputSource)].slice(0, HISTORY_LIMIT));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getFullMarkdown = (res: ParaphraseResult) => {
    let md = `> **Original:** *${res.original}*`;
    if (res.original_vietnamese) md += ` (${res.original_vietnamese})`;
    md += `\n\n`;
    md += `* **B2:** *${res.b2}* ${res.b2_vietnamese ? `(${res.b2_vietnamese})` : ''}\n`;
    md += `* **C1:** *${res.c1}* ${res.c1_vietnamese ? `(${res.c1_vietnamese})` : ''}\n`;
    md += `* **C1+:** *${res.c1_plus}* ${res.c1_plus_vietnamese ? `(${res.c1_plus_vietnamese})` : ''}\n`;
    md += `* **C2:** *${res.c2}* ${res.c2_vietnamese ? `(${res.c2_vietnamese})` : ''}`;
    return md;
  };

  const isSingleWord = (text: string) => {
    return text.trim().split(/\s+/).length === 1;
  };

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 md:px-12 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8" id="main-content">
        {/* Left Column: Input Panel */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="input-section">
          {/* Main Input Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-24" id="input-card">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Your Word, Phrase or Sentence</span>
              <span className="text-xs text-slate-400 font-normal">{inputText.length}/1000 · Ctrl+Enter</span>
            </label>
            
            <textarea
              id="input-text-area"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isLoading) handleParaphrase(inputText);
              }}
              maxLength={1000}
              aria-label="Your word, phrase or sentence"
              placeholder="Type a word (e.g. 'important') to upgrade vocabulary, or a sentence/phrase to paraphrase."
              className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 resize-none text-sm leading-relaxed transition-all"
            />

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                id="clear-btn"
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Clear Input
              </button>
              
              <button
                id="submit-paraphrase-btn"
                onClick={() => handleParaphrase(inputText)}
                disabled={isLoading || !inputText.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Upgrades</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100" id="topic-chips">
              <p className="text-[11px] font-semibold text-slate-500 mb-2">Thử nhanh theo chủ đề IELTS:</p>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => { setInputText(t.text); handleParaphrase(t.text); }}
                    disabled={isLoading}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100" id="history">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Lịch sử tra cứu
                  </p>
                  <button onClick={() => setHistory([])} className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer">
                    Xoá hết
                  </button>
                </div>
                <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {history.map((h) => (
                    <li key={h.timestamp} className="flex items-center gap-1 group/h">
                      <button
                        onClick={() => { setInputText(h.inputSource); setResult(h); setError(null); }}
                        className="flex-1 text-left text-xs text-slate-600 hover:text-indigo-700 truncate py-1 cursor-pointer"
                        title={h.inputSource}
                      >
                        {h.inputSource}
                      </button>
                      <button
                        onClick={() => setHistory((prev) => prev.filter((x) => x.timestamp !== h.timestamp))}
                        className="opacity-0 group-hover/h:opacity-100 p-1 text-slate-300 hover:text-rose-600 cursor-pointer"
                        aria-label="Xoá khỏi lịch sử"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Paraphrase Results */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="results-section">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 flex items-start gap-3 shadow-sm" id="error-box">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Operation Failed</h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]" id="loading-box">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-indigo-600 absolute animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Enhancing with Academic Precision</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Detecting language, performing precise contextual translations, and crafting academic-level upgrades...
                </p>
              </div>
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[400px]" id="empty-state">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">No Active Paraphrases</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Enter your text on the left, or type a single word to upgrade, then press "Generate Upgrades" to view suggestions.
              </p>
            </div>
          )}

          {result && !isLoading && (
            <div className="flex flex-col gap-6" id="results-display">
              {/* Original sentence presentation */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 shadow-sm" id="original-phrase-card">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Original Statement / Word
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded font-semibold">
                    {isSingleWord(result.inputSource) ? "Vocabulary Upgrade Mode" : "Paraphrase Mode"}
                  </span>
                </div>
                <p className="text-slate-800 font-bold italic text-sm leading-relaxed">
                  "{result.original}"
                </p>
                {result.original_vietnamese && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    <span className="text-slate-400 font-bold mr-1">BẢN DỊCH:</span> {result.original_vietnamese}
                  </p>
                )}
              </div>

              {/* Progress Stack */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5" id="level-stack">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>Progressive IELTS {isSingleWord(result.inputSource) ? "Vocabulary Upgrades" : "Paraphrase Levels"}</span>
                  <span className="text-xs font-normal text-slate-400">(B2 to C2 range)</span>
                </h3>

                {/* B2 Level */}
                <div className="group border border-slate-100 hover:border-slate-200 rounded-xl p-4 transition-all hover:bg-slate-50/50" id="level-b2-card">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase">
                        B2
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">Vantage / Solid Upper-Intermediate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speak(result.b2)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                      aria-label="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="copy-b2-btn"
                      onClick={() => triggerCopy(result.b2, 'b2')}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition-all cursor-pointer"
                      title="Copy B2 Paraphrase"
                    >
                      {copiedId === 'b2' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    </div>
                  </div>
                  <p className="text-slate-900 text-sm font-semibold leading-relaxed italic select-all">
                    "{result.b2}"
                  </p>
                  {result.b2_vietnamese && (
                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                      <span className="text-indigo-600 font-bold mr-1">Nghĩa tiếng Việt:</span> {result.b2_vietnamese}
                    </p>
                  )}
                </div>

                {/* C1 Level */}
                <div className="group border border-purple-100 hover:border-purple-200 rounded-xl p-4 transition-all bg-purple-50/10 hover:bg-purple-50/20" id="level-c1-card">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full uppercase">
                        C1
                      </span>
                      <span className="text-[11px] font-semibold text-purple-700/80">Advanced Academic</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speak(result.c1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                      aria-label="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="copy-c1-btn"
                      onClick={() => triggerCopy(result.c1, 'c1')}
                      className="p-1.5 rounded-lg border border-purple-200/50 text-purple-400 hover:text-purple-700 hover:bg-white transition-all cursor-pointer"
                      title="Copy C1 Paraphrase"
                    >
                      {copiedId === 'c1' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    </div>
                  </div>
                  <p className="text-slate-900 text-sm font-bold leading-relaxed italic select-all">
                    "{result.c1}"
                  </p>
                  {result.c1_vietnamese && (
                    <p className="text-xs text-purple-900 mt-1.5 font-medium leading-relaxed">
                      <span className="text-purple-700 font-bold mr-1">Nghĩa tiếng Việt:</span> {result.c1_vietnamese}
                    </p>
                  )}
                </div>

                {/* C1+ Level */}
                <div className="group border border-indigo-100 hover:border-indigo-200 rounded-xl p-4 transition-all bg-indigo-50/20 hover:bg-indigo-50/35" id="level-c1-plus-card">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full uppercase">
                        C1+
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-700/80">Highly Proficient Academic</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speak(result.c1_plus)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                      aria-label="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="copy-c1plus-btn"
                      onClick={() => triggerCopy(result.c1_plus, 'c1_plus')}
                      className="p-1.5 rounded-lg border border-indigo-200/50 text-indigo-400 hover:text-indigo-700 hover:bg-white transition-all cursor-pointer"
                      title="Copy C1+ Paraphrase"
                    >
                      {copiedId === 'c1_plus' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    </div>
                  </div>
                  <p className="text-slate-900 text-sm font-bold leading-relaxed italic select-all">
                    "{result.c1_plus}"
                  </p>
                  {result.c1_plus_vietnamese && (
                    <p className="text-xs text-indigo-900 mt-1.5 font-medium leading-relaxed">
                      <span className="text-indigo-700 font-bold mr-1">Nghĩa tiếng Việt:</span> {result.c1_plus_vietnamese}
                    </p>
                  )}
                </div>

                {/* C2 Level */}
                <div className="group border border-amber-200 hover:border-amber-300 rounded-xl p-4 transition-all bg-amber-50/20 hover:bg-amber-50/30" id="level-c2-card">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full uppercase ring-1 ring-amber-300">
                        C2
                      </span>
                      <span className="text-[11px] font-bold text-amber-800/90 flex items-center gap-1">
                        Near-Native Mastery
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speak(result.c2)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                      aria-label="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="copy-c2-btn"
                      onClick={() => triggerCopy(result.c2, 'c2')}
                      className="p-1.5 rounded-lg border border-amber-200/50 text-amber-500 hover:text-amber-800 hover:bg-white transition-all cursor-pointer"
                      title="Copy C2 Paraphrase"
                    >
                      {copiedId === 'c2' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    </div>
                  </div>
                  <p className="text-slate-900 text-sm font-extrabold leading-relaxed italic select-all">
                    "{result.c2}"
                  </p>
                  {result.c2_vietnamese && (
                    <p className="text-xs text-amber-900 mt-1.5 font-semibold leading-relaxed">
                      <span className="text-amber-800 font-bold mr-1">Nghĩa tiếng Việt:</span> {result.c2_vietnamese}
                    </p>
                  )}
                </div>
              </div>

              {/* Vocabulary Breakdown Section */}
              {result.vocabulary && result.vocabulary.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="vocabulary-card">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Phân tích từ vựng & Cấu trúc học thuật</span>
                      <span className="text-xs font-normal text-slate-400">· bấm ☆ để lưu vào sổ từ</span>
                      <span className="text-xs font-normal text-slate-400">(Nghĩa, loại từ & cấp độ)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="vocab-grid">
                    {result.vocabulary.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex flex-col justify-between gap-1.5"
                        id={`vocab-item-${index}`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/40 pb-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-slate-900 text-sm font-mono tracking-tight select-all">
                              {item.word}
                            </span>
                            <button onClick={() => speak(item.word)} className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer" aria-label={`Nghe ${item.word}`}>
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onToggleSave(item)}
                              className={`p-1 cursor-pointer ${isSaved(item.word) ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                              aria-label={isSaved(item.word) ? 'Bỏ khỏi sổ từ' : 'Lưu vào sổ từ'}
                              title={isSaved(item.word) ? 'Bỏ khỏi sổ từ' : 'Lưu vào sổ từ'}
                            >
                              <Star className="w-3.5 h-3.5" fill={isSaved(item.word) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-600 rounded">
                              {item.type}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded text-white ${
                              item.level?.startsWith('C2') ? 'bg-amber-500' :
                              item.level?.startsWith('C1') ? 'bg-purple-500' : 'bg-blue-500'
                            }`}>
                              {item.level}
                            </span>
                          </div>
                        </div>
                        {item.ipa && <p className="text-[11px] text-slate-400 font-mono">{item.ipa}</p>}
                        <p className="text-xs text-slate-700 font-medium">
                          <span className="text-slate-400 mr-1 text-[10px] font-bold uppercase">Nghĩa:</span>
                          {item.meaning}
                        </p>
                        {item.example && (
                          <p className="text-[11px] text-slate-500 italic leading-relaxed">“{item.example}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Required Output Format & Clipboard Tool */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="markdown-card">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Standard IELTS Output Format
                    </h3>
                  </div>
                  <button
                    id="copy-full-markdown-btn"
                    onClick={() => triggerCopy(getFullMarkdown(result), 'full')}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {copiedId === 'full' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied Format!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Format</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Visual markdown representation preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 font-mono text-[11px] text-slate-600 space-y-2 leading-relaxed whitespace-pre-wrap select-text" id="markdown-preview">
                  <span className="text-slate-400 font-sans font-semibold text-[10px] block mb-1">Markdown View:</span>
                  <div>{`> **Original:** *${result.original}*${result.original_vietnamese ? ` (${result.original_vietnamese})` : ''}`}</div>
                  <div className="h-2"></div>
                  <div>{`* **B2:** *${result.b2}*${result.b2_vietnamese ? ` (${result.b2_vietnamese})` : ''}`}</div>
                  <div>{`* **C1:** *${result.c1}*${result.c1_vietnamese ? ` (${result.c1_vietnamese})` : ''}`}</div>
                  <div>{`* **C1+:** *${result.c1_plus}*${result.c1_plus_vietnamese ? ` (${result.c1_plus_vietnamese})` : ''}`}</div>
                  <div>{`* **C2:** *${result.c2}*${result.c2_vietnamese ? ` (${result.c2_vietnamese})` : ''}`}</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
