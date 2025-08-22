import './App.css'

function App() {

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <h1 className="font-arcade text-xs sm:text-sm">Gold Mine Tycoon</h1>
              <span className="text-xs text-slate-400">Phase 1 • MVP</span>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-10">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
              <h2 className="mb-2 text-xl font-semibold">Hello, Miner ⛏️</h2>
              <p className="text-slate-300">Vite + TS + Tailwind is live.</p>
            </div>
          </main>

          <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
            Built with Vite • Tailwind
          </footer>
        </div>
    );
}

export default App
