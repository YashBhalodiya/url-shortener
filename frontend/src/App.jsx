import { useState, useEffect } from 'react'
import { ArrowRight, Copy, ExternalLink, Activity, BarChart2, CheckCircle2, Loader2, Link } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = import.meta.env.VITE_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8001' : window.location.origin);

function RecentLinkItem({ link, activeLinkId, setActiveLinkId, handleCopy, copiedId, getFullShortUrl }) {
  const { data } = useQuery({
    queryKey: ['analytics', link.shortId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/url/analytics/${link.shortId}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    refetchInterval: 10000
  });

  return (
    <div 
      onClick={() => setActiveLinkId(link.shortId)}
      className={`group flex items-center justify-between p-4 md:p-5 rounded-[1.5rem] transition-all cursor-pointer border backdrop-blur-md ${activeLinkId === link.shortId ? 'bg-white shadow-xl shadow-ink/5 border-white scale-[1.02] ring-4 ring-white/50' : 'bg-paper/40 border-white/50 hover:bg-white hover:border-white hover:shadow-lg hover:shadow-ink/5 hover:-translate-y-1'}`}
    >
      <div className="overflow-hidden pr-4 flex-1">
        <p className="font-mono font-bold text-teal text-base md:text-[1.1rem] mb-1.5 truncate drop-shadow-sm">
          {getFullShortUrl(link.shortId).replace(/^https?:\/\//, '')}
        </p>
        <p className="text-xs md:text-sm text-ink/40 truncate font-medium flex items-center gap-1.5">
          <Link className="w-3 h-3" />
          {link.originalUrl}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink/5 text-[10px] md:text-xs font-bold text-ink/50 uppercase tracking-widest">
            <BarChart2 className="w-3 h-3" />
            {data ? `${data.totalClicks || 0} clicks` : 'Loading'}
          </span>
        </div>
      </div>
      <div className={`flex flex-col sm:flex-row gap-2 transition-all duration-300 ${activeLinkId === link.shortId ? 'opacity-100 translate-x-0' : 'opacity-100 sm:opacity-0 group-hover:opacity-100 sm:translate-x-4 group-hover:translate-x-0'}`}>
        <button 
          aria-label="Copy to clipboard"
          onClick={(e) => { e.stopPropagation(); handleCopy(link.shortId); }}
          className="p-3 bg-paper/50 rounded-xl hover:shadow-md text-ink/60 hover:text-teal hover:bg-teal/10 transition-all active:scale-95"
        >
          {copiedId === link.shortId ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success animate-in zoom-in" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <a 
          href={getFullShortUrl(link.shortId)}
          target="_blank"
          aria-label="Open Link"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-3 bg-paper/50 rounded-xl hover:shadow-md text-ink/60 hover:text-rust hover:bg-rust/10 transition-all active:scale-95"
        >
          <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
        </a>
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState('')
  const [expiresIn, setExpiresIn] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [liveMessage, setLiveMessage] = useState('')
  
  const [recentLinks, setRecentLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentLinks')) || []
    } catch {
      return []
    }
  })
  
  const [activeLinkId, setActiveLinkId] = useState(null)

  useEffect(() => {
    localStorage.setItem('recentLinks', JSON.stringify(recentLinks))
    if (!activeLinkId && recentLinks.length > 0) {
      setActiveLinkId(recentLinks[0].shortId)
    }
  }, [recentLinks, activeLinkId])

  const createLinkMutation = useMutation({
    mutationFn: async (originalUrl) => {
      // Prepare body payload
      const payload = { url: originalUrl };
      if (expiresIn) payload.expiresIn = Number(expiresIn);

      const res = await fetch(`${API_URL}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      })
      if (!res.ok) throw new Error('Failed to create short link')
      return res.json()
    },
    onSuccess: (data, variables) => {
      const newShortId = data.id || data.shortId
      const newEntry = {
        shortId: newShortId,
        originalUrl: variables,
        createdAt: new Date().toISOString()
      }
      setRecentLinks(prev => [newEntry, ...prev.filter(l => l.shortId !== newShortId)].slice(0, 10))
      setActiveLinkId(newShortId)
      setUrl('')
      setLiveMessage('Link shortened successfully!')
    },
    onError: () => {
      setLiveMessage('Error shortening the link.')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
       finalUrl = 'https://' + finalUrl
    }
    createLinkMutation.mutate(finalUrl)
  }

  const activeLink = recentLinks.find(l => l.shortId === activeLinkId) || recentLinks[0]
  
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', activeLink?.shortId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/url/analytics/${activeLink.shortId}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    enabled: !!activeLink?.shortId,
    refetchInterval: 5000
  })

  const getFullShortUrl = (shortId) => `${BASE_URL}/${shortId}`

  const handleCopy = (shortId) => {
    const fullUrl = getFullShortUrl(shortId)
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(shortId)
    setLiveMessage('Link copied to clipboard')
    setTimeout(() => { setCopiedId(null); setLiveMessage(''); }, 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-ink p-6 md:p-12 lg:p-24 overflow-x-hidden relative z-0">
       {/* Accessibility Live Region */}
       <div aria-live="polite" className="sr-only">{liveMessage}</div>

       {/* Hero & Form */}
       <header className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between xl:px-12 mb-16 lg:mb-24 mt-8 relative">
          
          <div className="flex-1 space-y-6 text-center lg:text-left relative z-10">
            <h1 className="text-5xl md:text-6xl xl:text-[5.5rem] font-bold font-display tracking-tight text-ink leading-[1.1] max-w-2xl">
              Short links, <br/><span className="text-teal">sharp style.</span>
            </h1>
            <p className="text-xl md:text-2xl text-ink/70 max-w-xl font-medium mx-auto lg:mx-0 leading-relaxed">
              Turn long, messy URLs into elegant, compact links instantly. Paste, shorten, and share seamlessly.
            </p>
          </div>
          
          <div className="w-full max-w-md xl:max-w-lg bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-ink/5 border border-white/50 relative z-10 transition-all hover:shadow-2xl duration-500 group">
            <form className="relative flex flex-col gap-6 z-10" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <label htmlFor="url-input" className="text-sm font-bold tracking-widest text-ink/70 uppercase ml-2 flex items-center gap-2">
                  <Link className="w-4 h-4 text-teal" /> Enter your long URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Link className="w-5 h-5 text-ink/30" />
                  </div>
                  <input 
                    id="url-input"
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    aria-invalid={createLinkMutation.isError}
                    aria-describedby={createLinkMutation.isError ? "error-msg" : undefined}
                    className="w-full bg-paper/50 border border-ink/5 focus:border-teal/50 rounded-[1.5rem] pl-12 pr-5 py-5 text-lg outline-none transition-all focus:ring-4 focus:ring-teal/10 font-mono shadow-inner placeholder:text-ink/30"
                    placeholder="https://example.com/very-long-link..."
                    required
                  />
                </div>
                {createLinkMutation.isError && (
                  <p id="error-msg" className="text-sm text-error font-semibold pl-2 flex items-center gap-1" role="alert">
                    <Activity className="w-4 h-4" /> Something went wrong. Please try again.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <label htmlFor="expires-input" className="text-sm font-bold tracking-widest text-ink/70 uppercase ml-2 flex items-center gap-2">
                  Expiration (Optional)
                </label>
                <select
                  id="expires-input"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full bg-paper/50 border border-ink/5 focus:border-teal/50 rounded-[1.5rem] px-5 py-4 text-lg outline-none transition-all focus:ring-4 focus:ring-teal/10 font-bold text-ink/70 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Never Expire</option>
                  <option value="300">5 Minutes</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">24 Hours</option>
                  <option value="604800">7 Days</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={createLinkMutation.isPending}
                className="w-full relative overflow-hidden bg-teal disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-lg py-5 rounded-[1.5rem] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 group/btn"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {createLinkMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      Make it short
                      <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
       </header>

       {/* Main Content Area: Result & Recents */}
       <main className="w-full max-w-[1400px] xl:px-12 grid lg:grid-cols-12 gap-8 lg:gap-12 mb-16 relative z-10">
          
          {/* Result Card */}
          <section className="lg:col-span-7 bg-ink text-paper p-8 lg:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-ink/40 flex flex-col hover:border-teal/30 transition-colors duration-500">
            {/* Solid accent circles instead of blur / gradient orbs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1a2827] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#2a1a15] rounded-full translate-y-1/2 -translate-x-1/3 opacity-40 pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <h2 className="text-xl md:text-2xl font-display font-semibold mb-10 flex items-center gap-3 text-paper/90">
                <div className="p-2.5 bg-teal/10 rounded-xl border border-teal/20">
                  <Activity className="w-6 h-6 text-teal" aria-hidden="true" />
                </div>
                Your Active Link
              </h2>
              
              {activeLink ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group/link bg-[#181a1f] border border-white/5 flex flex-col md:flex-row text-paper p-2.5 pl-6 rounded-[1.5rem] items-center justify-between mb-8 shadow-xl transition-all duration-300 hover:bg-[#1f2127] gap-4 md:gap-0 overflow-hidden">
                     <span className="font-mono text-base md:text-lg lg:text-xl font-bold truncate transition-colors w-full text-center md:text-left py-2 mr-2 relative z-10 drop-shadow-sm text-teal-50">
                       {getFullShortUrl(activeLink.shortId).replace(/^https?:\/\//, '')}
                     </span>
                     <div className="flex gap-2 w-full md:w-auto shrink-0 relative z-10">
                       <button 
                         onClick={() => handleCopy(activeLink.shortId)}
                         className="flex-1 md:flex-none p-3 lg:p-4 bg-white/10 hover:bg-teal hover:text-white hover:shadow-[0_0_20px_-5px_rgba(30,122,115,0.5)] rounded-xl transition-all text-paper flex justify-center items-center group/btn"
                         title="Copy URL"
                         aria-label="Copy short URL"
                       >
                         {copiedId === activeLink.shortId ? <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-success animate-in zoom-in" /> : <Copy className="w-5 h-5 lg:w-6 lg:h-6 group-hover/btn:scale-110 transition-transform" />}
                       </button>
                       <a 
                         href={getFullShortUrl(activeLink.shortId)}
                         target="_blank"
                         rel="noreferrer"
                         className="flex-1 md:flex-none p-3 lg:p-4 bg-white/10 hover:bg-rust hover:text-white hover:shadow-[0_0_20px_-5px_rgba(198,93,58,0.5)] rounded-xl transition-all text-paper flex justify-center items-center group/btn"
                         title="Open URL"
                         aria-label="Open short URL in new tab"
                       >
                          <ExternalLink className="w-5 h-5 lg:w-6 lg:h-6 group-hover/btn:scale-110 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                       </a>
                     </div>
                  </div>
                  
                  <div className="bg-paper/5 rounded-2xl p-5 border border-white/5 mb-auto backdrop-blur-sm">
                    <p className="text-sm font-mono truncate text-paper/80" title={activeLink.originalUrl}>
                      <span className="text-teal font-semibold mr-3 bg-teal/20 px-2 py-1 rounded text-xs">DESTINATION</span>
                      {activeLink.originalUrl}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 items-center border-t border-white/10 pt-8 mt-10 gap-4">
                     <div className="bg-paper/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm text-center md:text-left transition-colors hover:bg-paper/10">
                        <p className="text-teal text-xs mb-2 tracking-widest font-bold truncate">CREATED</p>
                        <p className="text-sm md:text-base lg:text-lg font-body font-medium truncate drop-shadow-md text-paper/90">
                           {new Date(activeLink.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                        </p>
                     </div>
                     <div className="bg-paper/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm text-center transition-colors hover:bg-paper/10 relative overflow-hidden group/stats">
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-teal transform origin-left scale-x-0 group-hover/stats:scale-x-100 transition-transform duration-500"></div>
                        <p className="text-teal text-xs mb-2 tracking-widest font-bold truncate">CLICKS</p>
                        <div className="text-2xl lg:text-3xl font-display font-bold tabular-nums drop-shadow-lg text-white">
                          {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin opacity-50 mx-auto" aria-hidden="true" /> : (analyticsData?.totalClicks || 0)}
                        </div>
                     </div>
                     <div className="bg-paper/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm text-center md:text-right transition-colors hover:bg-paper/10">
                        <p className="text-teal text-xs mb-2 tracking-widest font-bold truncate">LAST VISIT</p>
                        <p className="text-sm md:text-base lg:text-lg font-body font-medium truncate drop-shadow-md text-paper/90">
                          {(!analyticsData?.visitHistory || analyticsData.visitHistory.length === 0) ? (
                            <span className="text-paper/40 italic">No data</span>
                          ) : (
                            new Date(analyticsData.visitHistory[analyticsData.visitHistory.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          )}
                        </p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-paper/30 py-12" aria-live="polite">
                   <div className="w-20 h-20 rounded-full bg-paper/5 flex items-center justify-center mb-6 border border-white/5">
                     <Link className="w-8 h-8 opacity-40" aria-hidden="true" />
                   </div>
                   <p className="font-medium text-lg">No links generated yet</p>
                   <p className="text-sm mt-2 opacity-60">Paste a URL above to get started</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Links */}
          <section className="lg:col-span-5 bg-white/80 backdrop-blur-2xl p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-ink/5 flex flex-col h-[550px]">
             <h2 className="text-xl md:text-2xl font-display font-semibold mb-8 flex items-center gap-3 text-ink shrink-0">
                <div className="p-2.5 bg-rust/10 rounded-xl border border-rust/10">
                  <BarChart2 className="w-6 h-6 text-rust" aria-hidden="true" />
                </div>
                 History
             </h2>
             
             <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar flex-1 -mr-2" role="list">
                {recentLinks.length === 0 ? (
                  <p className="text-ink/40 text-center py-8 font-medium" role="listitem">Your recently shortened URLs will appear here.</p>
                ) : (
                  recentLinks.map(link => (
                    <RecentLinkItem 
                      key={link.shortId} 
                      link={link} 
                      activeLinkId={activeLinkId} 
                      setActiveLinkId={setActiveLinkId} 
                      handleCopy={handleCopy} 
                      copiedId={copiedId} 
                      getFullShortUrl={getFullShortUrl} 
                    />
                  ))
                )}
             </div>
          </section>

       </main>

       {/* Footer */}
       <footer className="mt-auto w-full max-w-[1400px] text-center xl:px-12 py-10 border-t border-ink/5">
          <p className="text-ink/60 font-semibold tracking-wide">Built for speed, designed for humans.</p>
       </footer>
    </div>
  )
}

export default App
