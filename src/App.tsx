import React, { useState, useEffect } from 'react';
import {
  Home,
  Map as MapIcon,
  PlusSquare,
  Bell,
  User,
  LayoutDashboard,
  Search,
  MessageCircle,
  Share2,
  ArrowBigUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Camera,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, ViewType } from './types';
import { cn, formatTimeAgo } from './utils';
import { analyzeIssueImage } from './services/aiService';
import { databases, storage, account, DATABASE_ID, COLLECTION_ID, BUCKET_ID, ID, Query } from './lib/appwrite';

// --- Components ---

const Navbar = ({ activeView, setView }: { activeView: ViewType, setView: (v: ViewType) => void }) => {
  const navItems = [
    { id: 'FEED', icon: Home, label: 'Home' },
    { id: 'MAP', icon: MapIcon, label: 'Map' },
    { id: 'CREATE', icon: PlusSquare, label: 'Post' },
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Admin' },
    { id: 'PROFILE', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-full md:border-r md:border-t-0">
      <div className="hidden md:flex mb-8 mt-4">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id as ViewType)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeView === item.id ? "text-teal-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <item.icon size={26} strokeWidth={activeView === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium md:hidden">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const StatusBadge = ({ status }: { status: Issue['status'] }) => {
  const configs = {
    REPORTED: { color: 'bg-yellow-400', label: 'Reported' },
    VERIFIED: { color: 'bg-blue-500', label: 'Verified' },
    IN_PROGRESS: { color: 'bg-orange-500', label: 'In Progress' },
    RESOLVED: { color: 'bg-green-500', label: 'Resolved' },
  };
  const config = configs[status];
  return (
    <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm", config.color)}>
      {config.label}
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: Issue['priority'] }) => {
  const colors = {
    CRITICAL: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-green-600',
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase", colors[priority])}>
      {priority}
    </span>
  );
};

const LoginView = ({ onLogin }: { onLogin: () => void }) => {
  const handleGoogleLogin = () => {
    account.createOAuth2Session(
      'google' as any,
      window.location.protocol + '//' + window.location.host,
      window.location.protocol + '//' + window.location.host + '?error=login_failed'
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[#f8fafc]" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100 rounded-full blur-[100px] opacity-40 animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 p-8 rounded-[40px] shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="w-20 h-20 bg-teal-600 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200"
            >
              <CheckCircle2 size={40} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">CivicGram</h1>
            <p className="text-gray-500 font-medium tracking-wide">Better Cities, Built Together.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98]"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-gray-700 font-bold">Continue with Google</span>
            </button>

            <button
              className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Learn how we protect your data
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm font-medium text-gray-500">
          Join thousands of citizens improving their neighborhoods.
        </p>
      </motion.div>
    </div>
  );
};

const IssueCard = ({ issue, onUpvote }: { issue: Issue, onUpvote: (id: string | number) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-100 md:border md:rounded-2xl md:mb-6 overflow-hidden max-w-xl mx-auto w-full"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
            {issue.user_id.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">@{issue.user_id}</span>
              <StatusBadge status={issue.status} />
            </div>
            <div className="flex items-center text-gray-400 text-[10px] gap-1">
              <MapPin size={10} />
              <span>{issue.category} • {formatTimeAgo(issue.created_at)}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400"><X size={20} /></button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={issue.image_url}
          alt={issue.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {issue.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-blue-500">VERIFIED IMAGE</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <div className="bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[10px] font-medium">
            Trust: {(issue.trust_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onUpvote(issue.id)}
              className="flex items-center gap-1 text-gray-700 hover:text-teal-600 transition-colors"
            >
              <ArrowBigUp size={28} />
              <span className="font-bold text-sm">{issue.upvotes}</span>
            </button>
            <button className="text-gray-700 hover:text-teal-600">
              <MessageCircle size={24} />
            </button>
            <button className="text-gray-700 hover:text-teal-600">
              <Share2 size={24} />
            </button>
          </div>
          <PriorityBadge priority={issue.priority} />
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-bold mr-2">@{issue.user_id}</span>
          <span className="text-gray-800 font-medium">{issue.title}</span>
          <p className="text-gray-600 mt-1 text-xs line-clamp-2">{issue.description}</p>
        </div>

        {issue.comment_count > 0 && (
          <button className="text-gray-400 text-xs mt-2">
            View all {issue.comment_count} comments
          </button>
        )}
      </div>
    </motion.div>
  );
};

const FeedView = ({ issues, onUpvote }: { issues: Issue[], onUpvote: (id: string | number) => void }) => {
  return (
    <div className="pb-20 pt-4 md:pt-24 md:pl-24">
      <div className="max-w-xl mx-auto px-4 mb-6 flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">CivicGram</h1>
        <div className="flex gap-4">
          <Bell size={24} className="text-gray-700" />
          <PlusSquare size={24} className="text-gray-700" />
        </div>
      </div>

      {/* Stories-like Categories */}
      <div className="flex gap-4 overflow-x-auto px-4 mb-6 no-scrollbar">
        {['Roads', 'Garbage', 'Water', 'Safety', 'Power', 'Parks'].map((cat) => (
          <div key={cat} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <MapPin size={24} />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-medium">{cat}</span>
          </div>
        ))}
      </div>

      <div className="space-y-0 md:space-y-6">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} onUpvote={onUpvote} />
        ))}
      </div>
    </div>
  );
};

const CreateView = ({ onIssueCreated }: { onIssueCreated: (issue: any, file?: File | null) => void }) => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep(2);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const runAIAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await analyzeIssueImage(image);
      setAnalysis(result);
      setCaption(result.description);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!analysis || !image) return;
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));

      const newIssue = {
        title: analysis.title,
        description: caption,
        category: analysis.category,
        image_url: image,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        priority: analysis.priority.toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        trust_score: analysis.trust_score,
        is_verified: !analysis.is_fake,
        user_id: 'citizen_joe',
        status: 'REPORTED' as const,
        upvotes: 0,
        comment_count: 0,
        created_at: new Date().toISOString()
      };

      onIssueCreated(newIssue, file);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 pt-4 md:pt-24 md:pl-24">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">New Issue Report</h2>
          <span className="text-sm text-gray-400">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl gap-4"
            >
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                <Camera size={40} />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Capture the Issue</p>
                <p className="text-gray-400 text-sm">Take a clear photo of the problem</p>
              </div>
              <label className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-teal-700 transition-colors">
                Open Camera
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              </label>
              <label className="text-teal-600 font-bold cursor-pointer">
                Upload from Gallery
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </motion.div>
          )}

          {step === 2 && image && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-inner">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="bg-teal-50 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-teal-600 mt-1" size={20} />
                <div>
                  <p className="font-bold text-teal-900 text-sm">AI Verification</p>
                  <p className="text-teal-700 text-xs">Our AI will now verify the image and categorize the issue for faster resolution.</p>
                </div>
              </div>
              <button
                onClick={runAIAnalysis}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Verify with AI"}
                {!loading && <ChevronRight size={20} />}
              </button>
            </motion.div>
          )}

          {step === 3 && analysis && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={image!} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm">{analysis.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">{analysis.category}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border",
                      analysis.is_fake ? "border-red-200 text-red-600" : "border-green-200 text-green-600"
                    )}>
                      {analysis.is_fake ? "Manipulation Detected" : "Verified Image"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500 h-32 resize-none"
                  placeholder="Tell us more about this issue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Priority</p>
                  <p className="font-bold text-teal-600">{analysis.priority}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Trust Score</p>
                  <p className="font-bold text-teal-600">{(analysis.trust_score * 100).toFixed(0)}%</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-200"
              >
                {loading ? "Posting..." : "Post to CivicGram"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const HeatMapView = ({ issues, onUpvote }: { issues: Issue[], onUpvote: (id: string | number) => void }) => {
  // Since we can't easily use react-leaflet without a lot of setup in this environment,
  // we'll build a custom Snapchat-style Heatmap using SVG and Framer Motion
  // This will look like a stylized map of a city.

  return (
    <div className="h-screen w-full bg-teal-950 relative overflow-hidden md:pl-24">
      {/* Stylized Map Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice">
          <path d="M0,100 L800,100 M0,300 L800,300 M0,500 L800,500 M0,700 L800,700 M0,900 L800,900" stroke="white" strokeWidth="2" />
          <path d="M100,0 L100,1200 M300,0 L300,1200 M500,0 L500,1200 M700,0 L700,1200" stroke="white" strokeWidth="2" />
          <circle cx="400" cy="600" r="300" fill="none" stroke="white" strokeWidth="1" strokeDasharray="10,10" />
        </svg>
      </div>

      {/* Heat Zones */}
      {issues.map((issue, i) => {
        // Map lat/lng to percentage for the stylized map
        // SF bounds roughly: 37.70 to 37.82 lat, -122.52 to -122.35 lng
        const latMin = 37.70, latMax = 37.82;
        const lngMin = -122.52, lngMax = -122.35;

        const x = ((issue.longitude - lngMin) / (lngMax - lngMin)) * 100;
        const y = (1 - (issue.latitude - latMin) / (latMax - latMin)) * 100;

        return (
          <motion.div
            key={issue.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="absolute cursor-pointer group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={cn(
              "w-16 h-16 -ml-8 -mt-8 rounded-full blur-2xl animate-pulse opacity-60",
              issue.priority === 'CRITICAL' ? "bg-red-500" :
                issue.priority === 'HIGH' ? "bg-orange-500" : "bg-teal-400"
            )} />
            <div className="relative -mt-10 -ml-4 flex flex-col items-center group-hover:scale-110 transition-transform">
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-xl">
                <img src={issue.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="bg-white px-2 py-0.5 rounded-full text-[8px] font-bold mt-1 shadow-sm border border-gray-100">
                {issue.category}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 right-6 md:left-30 flex justify-between items-center z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-full flex gap-1">
          {['All', 'Roads', 'Garbage', 'Safety'].map(f => (
            <button key={f} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
              f === 'All' ? "bg-white text-teal-950" : "text-white hover:bg-white/10"
            )}>
              {f}
            </button>
          ))}
        </div>
        <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white">
          <Filter size={20} />
        </button>
      </div>

      <div className="absolute bottom-24 left-6 right-6 md:left-30 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Nearby Issues</h3>
          <span className="text-teal-400 text-xs font-bold">Live Updates</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {issues.slice(0, 5).map(issue => (
            <div key={issue.id} className="flex-shrink-0 w-32 bg-white/10 rounded-2xl p-2 border border-white/10">
              <img src={issue.image_url} className="w-full aspect-square object-cover rounded-xl mb-2" />
              <p className="text-white text-[10px] font-bold truncate">{issue.title}</p>
              <p className="text-teal-400 text-[8px] uppercase font-bold">{issue.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ issues, onStatusUpdate }: { issues: Issue[], onStatusUpdate: (id: string | number, status: Issue['status']) => void }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4 md:pt-24 md:pl-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            <p className="text-gray-500 text-sm">Authority Dashboard • {issues.length} Active Reports</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
              <Filter size={16} />
              Filter by Priority
            </div>
            <div className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
              Export Report
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Reports', value: issues.length, color: 'text-blue-600' },
              { label: 'Critical', value: issues.filter(i => i.priority === 'CRITICAL').length, color: 'text-red-600' },
              { label: 'In Progress', value: issues.filter(i => i.status === 'IN_PROGRESS').length, color: 'text-orange-600' },
              { label: 'Resolved', value: issues.filter(i => i.status === 'RESOLVED').length, color: 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">{stat.label}</p>
                <p className={cn("text-2xl font-black mt-1", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Issue Table */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Issue</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Trust</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {issues.map(issue => (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={issue.image_url} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-sm truncate max-w-[200px]">{issue.title}</p>
                            <p className="text-[10px] text-gray-400">@{issue.user_id} • {formatTimeAgo(issue.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600">{issue.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: `${issue.trust_score * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold">{(issue.trust_score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={issue.status}
                          onChange={(e) => onStatusUpdate(issue.id, e.target.value as Issue['status'])}
                          className="text-xs font-bold bg-gray-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="REPORTED">Reported</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ issues, onUpvote, user, onLogout }: { issues: Issue[], onUpvote: (id: string | number) => void, user: any, onLogout: () => void }) => {
  const userIssues = issues.filter(issue => issue.user_id === user?.$id);
  const totalUpvotes = userIssues.reduce((sum, issue) => sum + issue.upvotes, 0);
  const resolvedIssues = userIssues.filter(issue => issue.status === 'RESOLVED').length;

  return (
    <div className="pb-20 pt-4 md:pt-24 md:pl-24 min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-gradient-to-tr from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-teal-200">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <button
            onClick={onLogout}
            className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
          <div className="flex gap-2 mt-4">
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">Verified Citizen</span>
            <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-xs font-bold border border-teal-100">Top Contributor</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl text-center border border-gray-100 shadow-sm">
            <p className="text-2xl font-black text-teal-600">{userIssues.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reports</p>
          </div>
          <div className="bg-white p-4 rounded-2xl text-center border border-gray-100 shadow-sm">
            <p className="text-2xl font-black text-blue-600">{totalUpvotes}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Impact</p>
          </div>
          <div className="bg-white p-4 rounded-2xl text-center border border-gray-100 shadow-sm">
            <p className="text-2xl font-black text-green-600">{resolvedIssues}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fixed</p>
          </div>
        </div>

        {/* User Issues Tab */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 px-2 text-gray-800">Your Reports</h2>
          <div className="space-y-4">
            {userIssues.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">You haven't reported any issues yet.</p>
                <button className="text-teal-600 font-bold text-sm mt-2">Create your first report</button>
              </div>
            ) : (
              <div className="space-y-6">
                {userIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} onUpvote={onUpvote} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewType>('FEED');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkUserSession = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );

      // Map Appwrite documents to our Issue type
      const mappedIssues: Issue[] = response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        image_url: doc.image_url,
        latitude: doc.latitude,
        longitude: doc.longitude,
        status: doc.status,
        priority: doc.priority,
        trust_score: doc.trust_score,
        is_verified: doc.is_verified,
        user_id: doc.user_id,
        upvotes: doc.upvotes,
        comment_count: doc.comment_count,
        created_at: doc.$createdAt,
      }));

      setIssues(mappedIssues);
    } catch (error) {
      console.error('Error fetching from Appwrite:', error);
      // Fallback for when Appwrite is not yet configured or fails:
      console.warn("Appwrite not configured or failed. Falling back to empty state. Please verify your .env.local variables and Appwrite permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
    fetchIssues();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpvote = async (id: number | string) => {
    // Optimistic UI update
    setIssues(issues.map(issue =>
      issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
    ));

    // Server update
    try {
      const issueToUpdate = issues.find(i => i.id === id);
      if (!issueToUpdate) return;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id.toString(),
        { upvotes: issueToUpdate.upvotes + 1 }
      );
    } catch (error) {
      console.error('Failed to upvote in Appwrite', error);
      // Revert optimistic update on failure
      fetchIssues();
    }
  };

  const handleStatusUpdate = async (id: number | string, status: Issue['status']) => {
    // Optimistic UI update
    setIssues(issues.map(issue =>
      issue.id === id ? { ...issue, status } : issue
    ));

    // Server Update
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id.toString(),
        { status }
      );
    } catch (error) {
      console.error('Failed to update status in Appwrite', error);
      fetchIssues();
    }
  };

  const handleIssueCreated = async (newIssueData: Omit<Issue, 'id'>, imageFile?: File | null) => {
    try {
      setLoading(true);

      let finalImageUrl = newIssueData.image_url;

      // Handle Image Upload to Appwrite Storage if we have a file
      if (imageFile) {
        try {
          const uploadedFile = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            imageFile
          );
          // Generate the cloud URL for the document
          finalImageUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
          console.log("Image uploaded to Appwrite Storage:", finalImageUrl);
        } catch (uploadError) {
          console.error("Failed to upload image to Storage:", uploadError);
          // Fallback or alert? We'll try to proceed with whatever URL we have, or alert
          alert("Failed to upload image to our cloud storage. The report might not have a photo.");
        }
      }

      // Clean up data for appwrite payload (remove undefined, map correctly)
      const payload = {
        title: newIssueData.title,
        description: newIssueData.description,
        category: newIssueData.category,
        image_url: finalImageUrl,
        latitude: newIssueData.latitude,
        longitude: newIssueData.longitude,
        status: newIssueData.status,
        priority: newIssueData.priority,
        trust_score: newIssueData.trust_score,
        is_verified: newIssueData.is_verified,
        user_id: newIssueData.user_id,
        upvotes: newIssueData.upvotes,
        comment_count: newIssueData.comment_count
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        'unique()', // Appwrite auto ID
        payload
      );

      // Refresh list to get real ID and latest data
      await fetchIssues();
      setView('FEED');
    } catch (error) {
      console.error("Failed to create issue in Appwrite", error);
      alert("Failed to create issue. Have you configured Appwrite correctly?");
      setLoading(false);
    }
  };

  if (!user && !loading) {
    return <LoginView onLogin={checkUserSession} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar activeView={view} setView={setView} />

      <main className="pb-4">
        {loading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'FEED' && <FeedView key="feed" issues={issues} onUpvote={handleUpvote} />}
            {view === 'MAP' && <HeatMapView key="map" issues={issues} onUpvote={handleUpvote} />}
            {view === 'CREATE' && <CreateView key="create" onIssueCreated={handleIssueCreated} />}
            {view === 'DASHBOARD' && <DashboardView key="dashboard" issues={issues} onStatusUpdate={handleStatusUpdate} />}
            {view === 'PROFILE' && <ProfileView key="profile" issues={issues} onUpvote={handleUpvote} user={user} onLogout={handleLogout} />}
          </AnimatePresence>
        )}
      </main>

      {/* Global CSS for no-scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
