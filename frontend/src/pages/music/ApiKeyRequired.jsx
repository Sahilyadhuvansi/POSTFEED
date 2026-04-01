import { AlertCircle } from "lucide-react";

const ApiKeyRequired = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full glass rounded-[40px] border border-white/5 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
          YouTube API Key Required
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Add your free YouTube Data API v3 key to Vercel environment variables
          to enable full music search.
        </p>
        <div className="text-left space-y-3 text-xs font-mono text-neutral-500 glass-dark rounded-2xl p-5 border border-white/5">
          <p className="text-neutral-300 font-sans font-black uppercase tracking-widest text-[10px] mb-3">
            Setup
          </p>
          <p>1. Go to console.cloud.google.com</p>
          <p>2. New project → Enable YouTube Data API v3</p>
          <p>3. APIs &amp; Services → Credentials → Create API Key</p>
          <p>4. Vercel → Project Settings → Environment Variables</p>
          <p className="text-indigo-400">
            5. Add: VITE_YOUTUBE_API_KEY = your_key
          </p>
          <p>6. Redeploy</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyRequired;
