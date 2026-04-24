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
      className={`group flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer border ${activeLinkId === link.shortId ? 'bg-paper border-ink/10 shadow-sm' : 'bg-paper/30 border-transparent hover:bg-paper/80 hover:border-ink/5 hover:-translate-y-0.5'}`}
    >
      <div className="overflow-hidden pr-4 flex-1">
        <p className="font-mono font-bold text-teal text-base md:text-lg mb-1 truncate">
          {getFullShortUrl(link.shortId).replace(/^https?:\/\//, '')}
        </p>
        <p className="text-sm text-ink/50 truncate font-medium">{link.originalUrl}</p>
        <p className="text-xs text-ink/40 mt-1 font-semibold">{data ? `${data.totalClicks || 0} clicks` : 'Loading...'}</p>
      </div>
      <div className={`flex gap-2 transition-opacity ${activeLinkId === link.shortId ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'}`}>
        <button 
          aria-label="Copy to clipboard"
          onClick={(e) => { e.stopPropagation(); handleCopy(link.shortId); }}
          className="p-2.5 bg-white rounded-xl shadow-sm text-ink/70 hover:text-teal hover:bg-teal/5 transition-colors"
        >
          {copiedId === link.shortId ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <a 
          href={getFullShortUrl(link.shortId)}
          target="_blank"
          aria-label="Open Link"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-2.5 bg-white rounded-xl shadow-sm text-ink/70 hover:text-rust hover:bg-rust/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
        </a>
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState('')
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
      const res = await fetch(`${API_URL}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: originalUrl })
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
    <div className="min-h-screen flex flex-col items-center bg-paper text-ink p-6 md:p-12 lg:p-24 overflow-x-hidden">
       {/* Accessibility Live Region */}
       <div aria-live="polite" className="sr-only">{liveMessage}</div>

       {/* Hero & Form */}
       <header className="w-full max-w-5xl md:text-left flex flex-col md:flex-row gap-10 lg:gap-24 items-center mb-16 lg:mb-24 mt-8">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight text-ink leading-tight max-w-2xl">
              Short links, sharp style.
            </h1>
            <p className="text-xl md:text-2xl text-ink/70 max-w-lg font-medium mx-auto md:mx-0">
              Turn long URLs into compact links instantly. Paste. Cut. Share.
            </p>
          </div>
          
          <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-ink/5 border border-ink/10 relative z-10 transition-transform hover:-translate-y-1 duration-500">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label htmlFor="url-input" className="text-sm font-semibold tracking-wide text-ink/80 uppercase ml-1">Enter your long URL</label>
                <input 
                  id="url-input"
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  aria-invalid={createLinkMutation.isError}
                  aria-describedby={createLinkMutation.isError ? "error-msg" : undefined}
                  className="w-full bg-paper/30 border-2 border-ink/10 focus:border-teal rounded-2xl p-5 text-lg outline-none transition-all focus:ring-4 focus:ring-teal/10 font-mono placeholder:text-ink/30"
                  placeholder="example.com/very-long..."
                  required
                />
                {createLinkMutation.isError && (
                  <p id="error-msg" className="text-sm text-error font-medium pl-1" role="alert">Something went wrong. Please try again.</p>
                )}
              </div>
              <button 
                type="submit"
                disabled={createLinkMutation.isPending}
                className="w-full bg-teal disabled:bg-teal/70 disabled:cursor-not-allowed text-white font-semibold text-lg py-5 rounded-2xl hover:bg-teal/90 transition-all flex items-center justify-center gap-3 group shadow-lg shadow-teal/20"
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    Make it short
                    <ArrowRight className="w-6 h-6 lg:group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </div>
       </header>

       {/* Main Content Area: Result & Recents */}
       <main className="w-full max-w-5xl grid md:grid-cols-2 gap-8 mb-16 relative">
          
          {/* Result Card */}
          <section className="bg-ink text-paper p-8 lg:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-ink/50 flex flex-col">
            <div className="absolute top-0 right-0 p-40 bg-teal/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100 opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-rust/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/3 transition-opacity opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
                <Activity className="w-7 h-7 text-teal" aria-hidden="true" /> Your Short Link
              </h2>
              
              {activeLink ? (
                <>
                  <div className="bg-paper flex flex-col md:flex-row text-ink p-2 pl-6 rounded-2xl items-center justify-between mb-8 shadow-inner group-hover:shadow-md transition-shadow gap-4 md:gap-0">
                     <span className="font-mono text-base md:text-lg lg:text-xl font-bold truncate transition-colors cursor-pointer w-full text-center md:text-left py-2 mr-2">
                       {getFullShortUrl(activeLink.shortId).replace(/^https?:\/\//, '')}
                     </span>
                     <div className="flex gap-2 w-full md:w-auto shrink-0">
                       <button 
                         onClick={() => handleCopy(activeLink.shortId)}
                         className="flex-1 md:flex-none p-3 lg:p-4 bg-ink/5 hover:bg-teal/10 hover:text-teal rounded-xl transition-colors text-ink/70 flex justify-center items-center"
                         title="Copy URL"
                         aria-label="Copy short URL"
                       >
                         {copiedId === activeLink.shortId ? <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-success" /> : <Copy className="w-5 h-5 lg:w-6 lg:h-6" />}
                       </button>
                       <a 
                         href={getFullShortUrl(activeLink.shortId)}
                         target="_blank"
                         rel="noreferrer"
                         className="flex-1 md:flex-none p-3 lg:p-4 bg-ink/5 hover:bg-rust/10 hover:text-rust rounded-xl transition-colors text-ink/70 flex justify-center items-center"
                         title="Open URL"
                         aria-label="Open short URL in new tab"
                       >
                          <ExternalLink className="w-5 h-5 lg:w-6 lg:h-6" />
                       </a>
                     </div>
                  </div>
                  
                  <p className="text-sm text-paper/70 font-mono truncate mb-auto pb-6" title={activeLink.originalUrl}>
                    <span className="text-paper/40 mr-2">From:</span>
                    {activeLink.originalUrl}
                  </p>

                  <div className="grid grid-cols-3 items-center border-t border-paper/10 pt-8 mt-auto gap-4">
                     <div>
                        <p className="text-paper/50 text-sm mb-2 uppercase tracking-wider font-semibold truncate">Created</p>
                        <p className="text-sm md:text-base lg:text-lg font-body font-medium truncate">
                           {new Date(activeLink.createdAt).toLocaleDateString()}
                        </p>
                     </div>
                     <div className="text-center border-l border-r border-paper/10 px-2 lg:px-4">
                        <p className="text-paper/50 text-sm mb-2 uppercase tracking-wider font-semibold truncate">Clicks</p>
                        <p className="text-2xl lg:text-3xl font-display font-bold tabular-nums">
                          {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin opacity-50 mx-auto" aria-hidden="true" /> : (analyticsData?.totalClicks || 0)}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-paper/50 text-sm mb-2 uppercase tracking-wider font-semibold truncate">Last Visit</p>
                        <p className="text-sm md:text-base lg:text-lg font-body font-medium truncate">
                          {!analyticsData?.visitHistory?.length ? (
                            <span className="text-paper/50">No data</span>
                          ) : (
                            new Date(analyticsData.visitHistory[analyticsData.visitHistory.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          )}
                        </p>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-paper/30 py-12" aria-live="polite">
                   <Link className="w-16 h-16 mb-4 opacity-20" aria-hidden="true" />
                   <p className="font-medium text-lg">No links generated yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Links */}
          <section className="bg-white p-8 lg:p-10 rounded-[2rem] border border-ink/10 shadow-xl shadow-ink/5 flex flex-col h-[500px]">
             <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3 text-ink shrink-0">
                <BarChart2 className="w-7 h-7 text-rust" aria-hidden="true" /> Recent Links
             </h2>
             
             <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1" role="list">
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
       <footer className="mt-auto w-full max-w-5xl text-center py-10 border-t border-ink/10">
          <p className="text-ink/60 font-semibold tracking-wide">Built for speed, designed for humans.</p>
       </footer>
    </div>
  )
}

export default App
