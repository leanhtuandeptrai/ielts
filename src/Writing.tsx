import { useState } from 'react';
import { Loader2, AlertCircle, ClipboardCheck, CheckCircle2, ArrowUpRight, PenLine } from 'lucide-react';
import { countWords, postJson, useLocalStorage } from './lib';

type Task = 'task1' | 'task2';

interface WritingResult {
  overall_band: number;
  criteria: { name: string; band: number; feedback: string }[];
  strengths?: string[];
  improvements?: string[];
  corrections?: { original: string; corrected: string; explanation: string }[];
  vocabulary_upgrades?: { original: string; upgrade: string; meaning: string }[];
  improved_paragraph?: string;
}

const MIN_WORDS: Record<Task, number> = { task1: 150, task2: 250 };

function bandColor(band: number) {
  if (band >= 7) return 'bg-emerald-100 text-emerald-800 ring-emerald-300';
  if (band >= 6) return 'bg-indigo-100 text-indigo-800 ring-indigo-300';
  if (band >= 5) return 'bg-amber-100 text-amber-800 ring-amber-300';
  return 'bg-rose-100 text-rose-800 ring-rose-300';
}

export default function Writing() {
  const [task, setTask] = useLocalStorage<Task>('ielts.writing.task', 'task2');
  const [question, setQuestion] = useLocalStorage('ielts.writing.question', '');
  const [essay, setEssay] = useLocalStorage('ielts.writing.essay', '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WritingResult | null>(null);

  const words = countWords(essay);
  const minWords = MIN_WORDS[task];

  const submit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await postJson<WritingResult>('/api/writing', { task, question, essay }));
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-12 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8" id="writing">
      <section className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="flex gap-2" role="radiogroup" aria-label="Loại bài">
            {(['task1', 'task2'] as Task[]).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={task === t}
                onClick={() => setTask(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  task === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {t === 'task1' ? 'Task 1 (≥150 từ)' : 'Task 2 (≥250 từ)'}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Đề bài <span className="text-xs font-normal text-slate-400">(không bắt buộc)</span></span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1500}
              placeholder="Dán đề bài vào đây để chấm Task Response chính xác hơn."
              className="mt-1.5 w-full h-20 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              <span>Bài viết của bạn</span>
              <span className={`text-xs font-semibold ${words >= minWords ? 'text-emerald-600' : 'text-amber-600'}`}>
                {words}/{minWords} từ
              </span>
            </span>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              maxLength={6000}
              placeholder="Dán hoặc gõ bài viết tiếng Anh của bạn."
              className="mt-1.5 w-full h-72 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed resize-y"
            />
          </label>
          {words > 0 && words < minWords && (
            <p className="text-[11px] text-amber-700 -mt-2">Bài dưới {minWords} từ sẽ bị trừ điểm khi thi thật.</p>
          )}

          <button
            onClick={submit}
            disabled={isLoading || words < 30}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            {isLoading ? 'Đang chấm bài...' : 'Chấm điểm bài viết'}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Điểm do AI ước lượng theo band descriptors công khai của IELTS, chỉ mang tính tham khảo.
          </p>
        </div>
      </section>

      <section className="lg:col-span-7 flex flex-col gap-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[400px]">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-bold text-slate-800">Giám khảo AI đang đọc bài của bạn...</p>
          </div>
        )}

        {!result && !isLoading && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[400px]">
            <PenLine className="w-8 h-8 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">Chấm bài IELTS Writing</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Nhận band điểm theo 4 tiêu chí, lỗi sai cần sửa, từ vựng nên nâng cấp và một đoạn văn mẫu band 8+.
            </p>
          </div>
        )}

        {result && !isLoading && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-20 h-20 rounded-2xl ring-2 flex flex-col items-center justify-center ${bandColor(result.overall_band)}`}>
                  <span className="text-[10px] font-bold uppercase">Overall</span>
                  <span className="text-3xl font-black">{result.overall_band}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Band ước lượng</h3>
                  <p className="text-xs text-slate-500">{task === 'task1' ? 'Task 1' : 'Task 2'} · {words} từ</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.criteria?.map((c) => (
                  <div key={c.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800">{c.name}</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ring-1 ${bandColor(c.band)}`}>{c.band}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {(result.strengths?.length || result.improvements?.length) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Điểm mạnh</h4>
                  <ul className="flex flex-col gap-2">
                    {result.strengths?.map((s, i) => (
                      <li key={i} className="text-xs text-slate-700 flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Để tăng band</h4>
                  <ul className="flex flex-col gap-2">
                    {result.improvements?.map((s, i) => (
                      <li key={i} className="text-xs text-slate-700 flex gap-2"><ArrowUpRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!!result.corrections?.length && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Lỗi cần sửa</h4>
                <ul className="flex flex-col gap-3">
                  {result.corrections.map((c, i) => (
                    <li key={i} className="text-xs border-l-2 border-rose-300 pl-3">
                      <p><span className="line-through text-rose-600">{c.original}</span> → <span className="font-semibold text-emerald-700">{c.corrected}</span></p>
                      <p className="text-slate-500 mt-0.5">{c.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!result.vocabulary_upgrades?.length && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Nâng cấp từ vựng</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.vocabulary_upgrades.map((v, i) => (
                    <div key={i} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p><span className="text-slate-500">{v.original}</span> → <span className="font-bold text-indigo-700">{v.upgrade}</span></p>
                      <p className="text-slate-500 mt-0.5">{v.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.improved_paragraph && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Đoạn văn mẫu band 8+</h4>
                <p className="text-xs text-slate-500 mb-3">Viết lại đoạn yếu nhất trong bài của bạn.</p>
                <p className="text-sm text-slate-800 leading-relaxed bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 whitespace-pre-wrap">
                  {result.improved_paragraph}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
