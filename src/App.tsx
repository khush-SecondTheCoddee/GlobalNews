import React, { useEffect, useState, useRef } from 'react';
import { 
  Newspaper, 
  Globe, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Camera, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDailyNews, generateSpeech, analyzeNewsImage, getNewsLocationInfo, NewsStory } from './services/gemini.ts';

export default function App() {
  const [news, setNews] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);
  const [locationInfo, setLocationInfo] = useState<{ text: string; grounding: any[] } | null>(null);
  const [isAnalyzingLocation, setIsAnalyzingLocation] = useState(false);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    const stories = await fetchDailyNews();
    setNews(stories);
    setLoading(false);
  };

  const handleListen = async (story: NewsStory) => {
    if (audioLoading) return;
    setAudioLoading(story.title);
    const base64Audio = await generateSpeech(story.summary);
    if (base64Audio) {
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    }
    setAudioLoading(null);
  };

  const handleLocationClick = async (story: NewsStory) => {
    setSelectedStory(story);
    setIsAnalyzingLocation(true);
    setLocationInfo(null);
    const info = await getNewsLocationInfo(story.location);
    setLocationInfo(info);
    setIsAnalyzingLocation(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeNewsImage(base64, file.type);
      setAnalysisResult(result);
      setIsAnalyzingImage(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 sticky top-0 bg-[#FDFCFB]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white">
              <Globe size={24} />
            </div>
            <h1 className="text-2xl font-serif italic tracking-tight">Global Pulse</h1>
          </div>
          <div className="text-xs uppercase tracking-widest font-medium opacity-50">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: News Feed */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-serif font-light tracking-tight">Top Stories</h2>
              {loading && <Loader2 className="animate-spin opacity-50" />}
            </div>

            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {news.map((story, idx) => (
                  <motion.div
                    key={story.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group border-b border-[#1A1A1A]/10 pb-8 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-[#1A1A1A]/5 rounded">
                        {story.category}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-medium opacity-40 flex items-center gap-1">
                        <MapPin size={10} /> {story.location}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-serif mb-4 group-hover:italic transition-all cursor-pointer">
                      {story.title}
                    </h3>
                    
                    <p className="text-[#4A4A4A] leading-relaxed mb-6 max-w-2xl">
                      {story.summary}
                    </p>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleListen(story)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-60 transition-opacity"
                      >
                        {audioLoading === story.title ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Volume2 size={16} />
                        )}
                        Listen
                      </button>
                      <button 
                        onClick={() => handleLocationClick(story)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-60 transition-opacity"
                      >
                        <MapPin size={16} />
                        Explore Context
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Interactive Tools */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Location Context Panel */}
          <section className="bg-[#1A1A1A] text-white p-8 rounded-3xl sticky top-32 shadow-2xl overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Info size={20} className="text-emerald-400" />
                <h2 className="text-xl font-serif italic">Geographic Context</h2>
              </div>

              <AnimatePresence mode="wait">
                {!selectedStory ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center opacity-40"
                  >
                    <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Select a story to explore its location and context</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedStory.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-serif mb-1">{selectedStory.location}</h3>
                      <p className="text-xs uppercase tracking-widest opacity-50">Related to: {selectedStory.title}</p>
                    </div>

                    {isAnalyzingLocation ? (
                      <div className="flex items-center gap-3 py-8 opacity-50">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm italic">Retrieving maps data...</span>
                      </div>
                    ) : locationInfo && (
                      <div className="space-y-6">
                        <div className="text-sm leading-relaxed text-white/80 italic">
                          {locationInfo.text}
                        </div>
                        
                        {locationInfo.grounding && locationInfo.grounding.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-white/10">
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Sources & Maps</p>
                            <div className="flex flex-wrap gap-2">
                              {locationInfo.grounding.map((chunk: any, i: number) => (
                                chunk.maps && (
                                  <a 
                                    key={i}
                                    href={chunk.maps.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                                  >
                                    <ExternalLink size={10} />
                                    {chunk.maps.title || 'View on Maps'}
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Decorative background element */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
          </section>

          {/* Image Analysis Panel */}
          <section className="border border-[#1A1A1A]/10 p-8 rounded-3xl bg-white">
            <div className="flex items-center gap-3 mb-6">
              <Camera size={20} className="text-[#1A1A1A]" />
              <h2 className="text-xl font-serif italic">Visual Insight</h2>
            </div>
            
            <p className="text-sm text-[#4A4A4A] mb-6">
              Upload a photo from a news event to get a deep AI analysis of its significance.
            </p>

            <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-[#1A1A1A]/10 rounded-2xl p-8 text-center group-hover:border-[#1A1A1A]/30 transition-colors">
                <Camera size={32} className="mx-auto mb-2 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest">Upload Image</span>
              </div>
            </div>

            <AnimatePresence>
              {isAnalyzingImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center gap-3 text-sm italic opacity-60"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing visual data...
                </motion.div>
              )}
              {analysisResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-[#1A1A1A]/5 rounded-xl text-sm leading-relaxed"
                >
                  <p className="font-bold text-[10px] uppercase tracking-widest mb-2 opacity-40">AI Analysis</p>
                  {analysisResult}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/10 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <span className="text-sm font-serif italic">Global Pulse</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-medium opacity-40">
            Powered by Gemini 3.1 & 2.5 • Real-time Grounding Enabled
          </p>
        </div>
      </footer>
    </div>
  );
}

