'use client';
import Image from "next/image";
import { useState } from 'react';

type TimelineItem = {
  date: string;
  event: string;
};

type BiasMap = {
  Left: string[];
  Center: string[];
  Right: string[];
};

function coerceTimeline(items: unknown): TimelineItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x: any): TimelineItem => ({
      date: String(x?.date ?? ''),
      event: String(x?.event ?? ''),
    }))
    .filter(it => it.date !== '' || it.event !== '');
}

export default function Home() {
  // --- FIXED: Removed quotes around "query" ---
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [bias, setBias] = useState<BiasMap>({ Left: [], Center: [], Right: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error('Missing NEXT_PUBLIC_BACKEND_URL');
      setSummary('Backend URL not configured. Please set NEXT_PUBLIC_BACKEND_URL.');
      setLoading(false);
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query);

      // 1) Headlines → Summary
      const headlinesRes = await fetch(`${backendUrl}/everything?topic=${encodedQuery}`);
      const headlinesData = await headlinesRes.json().catch(() => ({} as any));

      if (Array.isArray(headlinesData?.articles) && headlinesData.articles.length > 0) {
        const firstArticleUrl = encodeURIComponent(headlinesData.articles[0]?.url ?? '');
        if (firstArticleUrl) {
          const summaryRes = await fetch(`${backendUrl}/summarize?article=${firstArticleUrl}`);
          const summaryData = await summaryRes.json().catch(() => ({} as any));
          if (typeof summaryData?.summary === 'string') {
            setSummary(summaryData.summary);
          } else {
            setSummary('No summary available.');
          }
        }
      } else {
        setSummary('No articles found for this topic.');
      }

      // 2) Timeline
      const timelineRes = await fetch(`${backendUrl}/timeline?topic=${encodedQuery}`);
      const timelineData = await timelineRes.json().catch(() => ({} as any));

      // backend returns: { timeline: "<json-string>" } OR { timeline: [...] } OR just [...]
      const parsedTimeline: TimelineItem[] = (() => {
        try {
          const rawTimelineContainer =
            typeof timelineData?.timeline === 'string'
              ? JSON.parse(timelineData.timeline)
              : timelineData?.timeline ?? timelineData;

          // Support shapes: { timeline: [...] } or [...]
          const rawArray = Array.isArray(rawTimelineContainer?.timeline)
            ? rawTimelineContainer.timeline
            : Array.isArray(rawTimelineContainer)
            ? rawTimelineContainer
            : [];

          return coerceTimeline(rawArray);
        } catch {
          return [] as TimelineItem[];
        }
      })();
      setTimeline(parsedTimeline);

      // 3) Bias Map
      const biasRes = await fetch(`${backendUrl}/bias?topic=${encodedQuery}`);
      const biasData = await biasRes.json().catch(() => ({} as any));

      const nextBias: BiasMap = {
        Left: Array.isArray(biasData?.Left) ? biasData.Left.map(String) : [],
        Center: Array.isArray(biasData?.Center) ? biasData.Center.map(String) : [],
        Right: Array.isArray(biasData?.Right) ? biasData.Right.map(String) : [],
      };
      setBias(nextBias);
    } catch (err) {
      console.error(err);
      setSummary('Something went wrong while generating the report.');
      setTimeline([]);
      setBias({ Left: [], Center: [], Right: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-bold mb-4">News AI</h1>

        <div className="flex w-full max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about a news topic..."
            className="flex-grow p-3 bg-gray-700 text-white rounded-l-lg focus:outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} // Optional: Add Enter key support
          />
          <button
            onClick={handleSearch}
            disabled={loading} // Optional: Disable button while loading
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold p-3 rounded-r-lg"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-8 w-full max-w-2xl space-y-8">
          {loading && <p className="text-center text-gray-400">Generating your AI report...</p>}

          {summary && (
            <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
              <h2 className="text-2xl font-bold mb-3 text-gray-100">Digest</h2>
              <p className="text-gray-300 leading-relaxed">{summary}</p>
            </div>
          )}

          {(bias.Left.length > 0 || bias.Center.length > 0 || bias.Right.length > 0) && (
            <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
              <h2 className="text-2xl font-bold mb-3 text-gray-100">Bias Map</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-red-400 border-b border-red-400/30 pb-2 mb-2">Left</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {bias.Left.map((title, i) => <li key={i}>{title}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-400 border-b border-blue-400/30 pb-2 mb-2">Center</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {bias.Center.map((title, i) => <li key={i}>{title}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-400 border-b border-green-400/30 pb-2 mb-2">Right</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {bias.Right.map((title, i) => <li key={i}>{title}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Show Timeline - Simplified rendering */}
          {timeline.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
              <h2 className="text-2xl font-bold mb-3 text-gray-100">Timeline</h2>
              <ul className="space-y-2">
                {timeline.map((item, i) => (
                  <li key={i} className="text-sm">
                    <strong className="text-gray-300">{item.date}:</strong>
                    <span className="ml-2 text-gray-400">{item.event}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!loading && !summary && timeline.length === 0 && bias.Left.length === 0 && bias.Center.length === 0 && bias.Right.length === 0) && (
            <p className="text-sm text-gray-500">Try searching for a topic to generate your report.</p>
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
