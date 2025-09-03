'use client';
import Image from "next/image";
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [bias, setBias] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleSearch = async () => {
    setLoading(true); // Show loading message

    // IMPORTANT: Make sure your FastAPI backend is running!
    // This is the address of your local backend server.
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // We need to encode the query to make it safe for a URL
    const encodedQuery = encodeURIComponent(query);

    // Fetch the summary for the first article found
    const headlinesRes = await fetch(`${backendUrl}/everything?topic=${encodedQuery}`);
    const headlinesData = await headlinesRes.json();

    if (headlinesData.articles && headlinesData.articles.length > 0) {
      const firstArticleUrl = encodeURIComponent(headlinesData.articles[0].url);

      const summaryRes = await fetch(`${backendUrl}/summarize?article=${firstArticleUrl}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
    }

    // Fetch the timeline
    const timelineRes = await fetch(`${backendUrl}/timeline?topic=${encodedQuery}`);
    const timelineData = await timelineRes.json();
    // We need to parse the timeline string into a JSON object
    setTimeline(JSON.parse(timelineData.timeline).timeline);

    // Fetch the bias map
    const biasRes = await fetch(`${backendUrl}/bias?topic=${encodedQuery}`);
    const biasData = await biasRes.json();
    setBias(biasData);

    setLoading(false); // Hide loading message
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
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-r-lg">
              Search
            </button>
        </div>
        <div className="mt-8 w-full max-w-2xl space-y-8">
          {/* Show loading message */}
          {loading && <p className="text-center text-gray-400">Generating your AI report...</p>}

          {/* Show Summary */}
          {summary && (
            <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
              <h2 className="text-2xl font-bold mb-3 text-gray-100">Digest</h2>
              <p className="text-gray-300 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Show Bias Map */}
          {bias && (
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

          {/* Show Timeline */}
          {timeline && timeline.length > 0 && (
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
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
