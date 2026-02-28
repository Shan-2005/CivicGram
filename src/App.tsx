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
  Filter,
  Navigation,
  Droplets,
  Trash2,
  Shield,
  Zap,
  Trees,
  Info,
  Car as Road
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, ViewType, Comment } from './types';
import { cn, formatTimeAgo } from './utils';
import { analyzeIssueImage, verifyImageAgainstDescription } from './services/aiService';
import { databases, storage, account, DATABASE_ID, COLLECTION_ID, COMMENTS_COLLECTION_ID, BUCKET_ID, ID, Query } from './lib/appwrite';
import MapComponent from './components/MapComponent';

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

const IssueCard = ({ issue, onUpvote, onDelete, onProfileClick, onCommentClick }: { key?: React.Key, issue: Issue, onUpvote: (id: string | number) => void, onDelete?: (id: string | number) => void, onProfileClick?: (username: string) => void, onCommentClick?: (id: string | number) => void }) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/?issue=${issue.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CivicGram Issue: ${issue.title}`,
          text: issue.description,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-100 md:border md:rounded-2xl md:mb-6 overflow-hidden max-w-xl mx-auto w-full"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onProfileClick?.(issue.user_id)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs hover:ring-2 hover:ring-teal-500 transition-all"
          >
            {issue.user_id.substring(0, 2).toUpperCase()}
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onProfileClick?.(issue.user_id)}
                className="font-semibold text-sm hover:text-teal-600 transition-colors"
              >
                @{issue.user_id}
              </button>
              <StatusBadge status={issue.status} />
            </div>
            <div className="flex items-center text-gray-400 text-[10px] gap-1">
              <MapPin size={10} />
              <span>{issue.category} • {formatTimeAgo(issue.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button onClick={() => onDelete(issue.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
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
            <button onClick={() => onCommentClick?.(issue.id)} className="text-gray-700 hover:text-teal-600 transition-colors">
              <MessageCircle size={24} />
            </button>
            <button onClick={handleShare} className="text-gray-700 hover:text-teal-600 transition-colors">
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

        {issue.comment_count >= 0 && (
          <button onClick={() => onCommentClick?.(issue.id)} className="text-gray-400 text-xs mt-2 hover:text-gray-600 transition-colors">
            View all {issue.comment_count} comments
          </button>
        )}
      </div>
    </motion.div>
  );
};

const FeedView = ({ issues, onUpvote, user, onProfileClick, onCommentClick }: { key?: React.Key, issues: Issue[], onUpvote: (id: string | number) => void, user: any, onProfileClick: (username: string) => void, onCommentClick?: (id: string | number) => void }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredIssues = activeCategory === 'All'
    ? issues
    : issues.filter(i => i.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="pb-20 pt-4 md:pt-24 md:pl-24">
      {/* Search Header for Desktop */}
      <div className="hidden md:flex max-w-xl mx-auto mb-8 px-4 items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search reports or areas..."
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
      </div>

      {/* Stories-like Categories */}
      <div className="flex gap-4 overflow-x-auto px-4 mb-6 no-scrollbar">
        {['All', 'Roads', 'Garbage', 'Water', 'Safety', 'Power', 'Parks'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex flex-col items-center gap-1 flex-shrink-0 group"
          >
            <div className={cn(
              "w-16 h-16 rounded-full p-[2px] transition-all",
              activeCategory === cat ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 scale-110" : "bg-gray-200"
            )}>
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
                  <MapPin size={24} />
                </div>
              </div>
            </div>
            <span className={cn("text-[10px] font-medium", activeCategory === cat ? "text-teal-600 font-bold" : "text-gray-500")}>{cat}</span>
          </button>
        ))}
      </div>

      <div className="space-y-0 md:space-y-6">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <IssueCard key={issue.id} issue={issue} onUpvote={onUpvote} onProfileClick={onProfileClick} onCommentClick={onCommentClick} />
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">No reports found for this category.</div>
        )}
      </div>
    </div>
  );
};

const CreateView = ({ onIssueCreated, user, initialLocation }: { key?: React.Key, onIssueCreated: (issue: any, file?: File | null) => void, user: any, initialLocation: { lat: number, lng: number } | null }) => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const categories = [
    { id: 'Roads', icon: <Road size={14} />, color: 'bg-amber-100 text-amber-600' },
    { id: 'Garbage', icon: <Trash2 size={14} />, color: 'bg-green-100 text-green-600' },
    { id: 'Water', icon: <Droplets size={14} />, color: 'bg-blue-100 text-blue-600' },
    { id: 'Safety', icon: <Shield size={14} />, color: 'bg-red-100 text-red-600' },
    { id: 'Power', icon: <Zap size={14} />, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'Parks', icon: <Trees size={14} />, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'Other', icon: <Info size={14} />, color: 'bg-gray-100 text-gray-600' }
  ];

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        () => {
          alert("Could not get your location. Please check your browser permissions.");
          setLoading(false);
        }
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep(3);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const runAIAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setVerificationError(null);
    try {
      const result = await verifyImageAgainstDescription(image, caption, location, selectedCategory);
      if (!result.isValid) {
        setVerificationError(`Images don't match: ${result.reason} (Similarity: ${result.similarity_score}%)`);
        setLoading(false);
        return;
      }
      setAnalysis(result);
      setStep(4);
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
      const newIssue = {
        title: analysis.title,
        description: caption,
        category: analysis.category,
        image_url: image,
        latitude: coordinates?.lat || 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: coordinates?.lng || -122.4194 + (Math.random() - 0.5) * 0.1,
        priority: analysis.priority.toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        trust_score: analysis.trust_score,
        is_verified: analysis.isValid,
        user_id: user?.name || 'citizen_joe',
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
          <span className="text-sm text-gray-400">Step {step} of 4</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500 h-24 resize-none"
                    placeholder="Describe the issue you're seeing..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                          selectedCategory === cat.id
                            ? "bg-teal-600 text-white border-teal-600 shadow-md scale-105"
                            : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                        )}
                      >
                        {cat.icon}
                        {cat.id}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location Hint</label>
                    <button
                      onClick={handleLocateMe}
                      className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:text-teal-700"
                    >
                      <Navigation size={12} />
                      Use My Location
                    </button>
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500 mb-4"
                    placeholder="e.g. 5th Ave and Market St"
                  />
                  <div className="h-64 mb-4">
                    <MapComponent
                      issues={[]}
                      onMapClick={(latlng) => setCoordinates(latlng)}
                      center={coordinates || { lat: 37.7749, lng: -122.4194 }}
                      selectedLocation={coordinates}
                      userLocation={initialLocation}
                      zoom={15}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Tip: Click the map to pin the exact location.</p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!caption || !location || !coordinates}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Next: Take Photo
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl gap-4"
            >
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                <Camera size={40} />
              </div>
              <div className="text-center px-4">
                <p className="font-bold text-lg">Capture the Issue</p>
                <p className="text-gray-400 text-sm">Now, take a clear photo of the problem you just described.</p>
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

          {step === 3 && image && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-inner">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
              {verificationError && (
                <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
                  <AlertCircle className="text-red-600 mt-1" size={20} />
                  <div>
                    <p className="font-bold text-red-900 text-sm">Verification Failed</p>
                    <p className="text-red-700 text-xs">{verificationError}</p>
                  </div>
                </div>
              )}
              <div className="bg-teal-50 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-teal-600 mt-1" size={20} />
                <div>
                  <p className="font-bold text-teal-900 text-sm">AI-Powered Check</p>
                  <p className="text-teal-700 text-xs">Our AI will now verify that the photo matches your description: "{caption}" at "{location}".</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold"
                >
                  Retake
                </button>
                <button
                  onClick={runAIAnalysis}
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Photo"}
                  {!loading && <ChevronRight size={20} />}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && analysis && (
            <motion.div
              key="step4"
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
                    <span className="bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 text-green-600">
                      Verified Match
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Verified Match</p>
                  <span className="text-xs font-black text-teal-700">{analysis.similarity_score}% Confidence</span>
                </div>
                <p className="text-sm text-teal-900 font-medium italic">"{analysis.description}"</p>
              </div>

              {analysis.visual_evidence && (
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Visual Evidence Identified</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{analysis.visual_evidence}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Priority</p>
                  <p className="font-bold text-teal-600">{analysis.priority}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">AI Trust</p>
                  <p className="font-bold text-teal-600">{(analysis.trust_score * 100).toFixed(0)}%</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-200"
              >
                {loading ? "Posting..." : "Confirm & Post"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const HeatMapView = ({ issues, onProfileClick, userLocation }: { key?: React.Key, issues: Issue[], onProfileClick: (username: string) => void, userLocation: { lat: number, lng: number } | null }) => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);

  return (
    <div className="h-screen w-full bg-gray-50 relative overflow-hidden md:pl-24">
      <div className="absolute top-20 left-6 md:left-30 z-[1000] flex gap-2">
        <div className="bg-white/90 backdrop-blur-xl p-1 rounded-2xl shadow-xl border border-white flex">
          <button
            onClick={() => setShowHeatMap(false)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              !showHeatMap ? "bg-teal-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"
            )}
          >
            Markers
          </button>
          <button
            onClick={() => setShowHeatMap(true)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              showHeatMap ? "bg-teal-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"
            )}
          >
            Heat Map
          </button>
        </div>
      </div>

      <MapComponent
        issues={issues}
        onMarkerClick={(issue) => setSelectedIssue(issue)}
        center={userLocation || { lat: 37.7749, lng: -122.4194 }}
        userLocation={userLocation}
        showHeatMap={showHeatMap}
        zoom={13}
      />

      {/* Issue Detail Overlay */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-24 left-6 right-6 md:left-30 bg-white/90 backdrop-blur-xl border border-gray-100 p-4 rounded-3xl z-20 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <img src={selectedIssue.image_url} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-sm">{selectedIssue.title}</h3>
                  <button
                    onClick={() => onProfileClick(selectedIssue.user_id)}
                    className="text-[10px] text-teal-600 font-bold"
                  >
                    @{selectedIssue.user_id}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 bg-gray-100 rounded-full text-gray-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={selectedIssue.status} />
              <PriorityBadge priority={selectedIssue.priority} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 right-6 md:left-30 flex justify-between items-center z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-1 rounded-full flex gap-1 pointer-events-auto shadow-lg">
          {['All', 'Roads', 'Garbage', 'Safety'].map(f => (
            <button key={f} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
              f === 'All' ? "bg-teal-600 text-white" : "text-gray-500 hover:bg-gray-100"
            )}>
              {f}
            </button>
          ))}
        </div>
        <button className="w-10 h-10 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-700 pointer-events-auto shadow-lg">
          <Filter size={20} />
        </button>
      </div>
    </div>
  );
};

const DashboardView = ({ issues, onStatusUpdate, onProfileClick }: { key?: React.Key, issues: Issue[], onStatusUpdate: (id: string | number, status: Issue['status']) => void, onProfileClick: (username: string) => void }) => {
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
                            <button
                              onClick={() => onProfileClick(issue.user_id)}
                              className="text-[10px] text-gray-400 hover:text-teal-600 transition-colors"
                            >
                              @{issue.user_id} • {formatTimeAgo(issue.created_at)}
                            </button>
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

const ProfileView = ({ issues, onUpvote, user, onLogout, onDeleteIssue, onProfileClick, onCommentClick, isPublic = false, targetUser = null }: { key?: React.Key, issues: Issue[], onUpvote: (id: string | number) => void, user: any, onLogout?: () => void, onDeleteIssue?: (id: string | number) => void, onProfileClick: (username: string) => void, onCommentClick?: (id: string | number) => void, isPublic?: boolean, targetUser?: any }) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'LIKED' | 'FOLLOWING'>('REPORTS');
  const displayUser = isPublic ? targetUser : user;
  const username = displayUser?.name || displayUser?.user_id || (typeof displayUser === 'string' ? displayUser : 'User');

  const userIssues = issues.filter(issue => issue.user_id === username);
  const totalUpvotes = userIssues.reduce((sum, issue) => sum + issue.upvotes, 0);
  const resolvedIssues = userIssues.filter(issue => issue.status === 'RESOLVED').length;

  return (
    <div className="pb-20 pt-4 md:pt-24 md:pl-24 min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4">
        {/* Back Button for Public Profile */}
        {isPublic && (
          <button
            onClick={() => onProfileClick('')}
            className="mb-4 flex items-center gap-1 text-teal-600 font-bold text-sm"
          >
            <ChevronRight size={20} className="rotate-180" />
            Back to Feed
          </button>
        )}

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-gradient-to-tr from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-teal-200">
            {username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">{username}</h1>
          {displayUser?.email && !isPublic && <p className="text-gray-500 text-sm">{displayUser.email}</p>}

          {!isPublic && onLogout && (
            <button
              onClick={onLogout}
              className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          )}

          {isPublic && (
            <button className="mt-4 px-8 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-200 active:scale-95 transition-transform">
              Follow
            </button>
          )}

          <div className="flex gap-2 mt-4">
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">Verified Citizen</span>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-8 px-2">
          {['REPORTS', 'LIKED', 'FOLLOWING'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "pb-2 text-xs font-bold uppercase tracking-widest transition-colors relative",
                activeTab === tab ? "text-teal-600" : "text-gray-400"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="space-y-4">
            {activeTab === 'REPORTS' && (
              userIssues.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No reports found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onUpvote={onUpvote}
                      onDelete={!isPublic ? onDeleteIssue : undefined}
                      onProfileClick={onProfileClick}
                      onCommentClick={onCommentClick}
                    />
                  ))}
                </div>
              )
            )}
            {activeTab === 'LIKED' && (
              <div className="text-center py-10 text-gray-400">Liked posts will appear here.</div>
            )}
            {activeTab === 'FOLLOWING' && (
              <div className="text-center py-10 text-gray-400">Following list will appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Comments Modal ---
const CommentsModal = ({ issueId, onClose, currentUser }: { issueId: string | number, onClose: () => void, currentUser: any }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!COMMENTS_COLLECTION_ID || COMMENTS_COLLECTION_ID === '') {
          console.warn("COMMENTS_COLLECTION_ID not set, simulating empty comments.");
          setFetching(false);
          return;
        }
        const res = await databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION_ID, [
          Query.equal('issue_id', issueId.toString()),
          Query.orderDesc('created_at')
        ]);
        setComments(res.documents.map((d: any) => ({
          id: d.$id,
          issue_id: d.issue_id,
          user_id: d.user_id,
          text: d.text,
          created_at: d.created_at
        })));
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setFetching(false);
      }
    };
    fetchComments();
  }, [issueId]);

  const handlePost = async () => {
    if (!newText.trim()) return;

    if (!COMMENTS_COLLECTION_ID || COMMENTS_COLLECTION_ID === '') {
      alert("Comments collection is not configured in .env.local yet!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        issue_id: issueId.toString(),
        user_id: currentUser?.name || 'anonymous',
        text: newText.trim(),
        created_at: new Date().toISOString()
      };
      const res = await databases.createDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, 'unique()', payload);
      setComments([{
        id: res.$id,
        issue_id: res.issue_id,
        user_id: res.user_id,
        text: res.text,
        created_at: res.created_at
      } as Comment, ...comments]);
      setNewText('');

      // Update comment count on issue in background
      try {
        const issueRes = await databases.getDocument(DATABASE_ID, COLLECTION_ID, issueId.toString());
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, issueId.toString(), {
          comment_count: (issueRes.comment_count || 0) + 1
        });
      } catch (e) { console.error("Could not update comment count on issue") }

    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:w-[400px] md:h-[600px] h-[80vh] rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg">Comments</h3>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fetching ? (
            <div className="text-center text-sm text-gray-400 py-10">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">No comments yet. Be the first to start the discussion!</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
                  {c.user_id.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{c.user_id} <span className="text-[10px] font-normal text-gray-400 ml-1">{formatTimeAgo(c.created_at)}</span></p>
                  <p className="text-sm text-gray-600 mt-1">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 md:rounded-b-3xl flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            placeholder="Add a comment..."
            className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handlePost}
            disabled={loading || !newText.trim()}
            className="bg-teal-600 text-white rounded-full px-4 font-bold text-sm disabled:opacity-50 transition-opacity flex items-center justify-center"
          >
            {loading ? '...' : 'Post'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewType>('FEED');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<string | null>(null);
  const [activeCommentsIssueId, setActiveCommentsIssueId] = useState<string | number | null>(null);

  const handleProfileClick = (username: string) => {
    if (!username) {
      setSelectedProfileUser(null);
      return;
    }
    if (username === user?.name) {
      setView('PROFILE');
      setSelectedProfileUser(null);
    } else {
      setSelectedProfileUser(username);
    }
  };

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

    // Detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          console.log("User location detected:", loc);
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error);
        }
      );
    }
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

  const handleDeleteIssue = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    // Optimistic UI update
    setIssues(issues.filter(issue => issue.id !== id));

    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id.toString());
    } catch (error) {
      console.error('Failed to delete issue in Appwrite', error);
      alert("Failed to delete issue.");
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
          // @ts-ignore
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
            {selectedProfileUser ? (
              <ProfileView
                key="public-profile"
                issues={issues}
                onUpvote={handleUpvote}
                user={user}
                onProfileClick={handleProfileClick}
                isPublic={true}
                targetUser={{ name: selectedProfileUser }}
              />
            ) : (
              <>
                {view === 'FEED' && <FeedView key="feed" issues={issues} onUpvote={handleUpvote} user={user} onProfileClick={handleProfileClick} onCommentClick={setActiveCommentsIssueId} />}
                {view === 'MAP' && <HeatMapView key="map" issues={issues} onProfileClick={handleProfileClick} userLocation={userLocation} />}
                {view === 'CREATE' && <CreateView key="create" onIssueCreated={handleIssueCreated} user={user} initialLocation={userLocation} />}
                {view === 'DASHBOARD' && <DashboardView key="dashboard" issues={issues} onStatusUpdate={handleStatusUpdate} onProfileClick={handleProfileClick} />}
                {view === 'PROFILE' && <ProfileView key="profile" issues={issues} onUpvote={handleUpvote} user={user} onLogout={handleLogout} onDeleteIssue={handleDeleteIssue} onProfileClick={handleProfileClick} onCommentClick={setActiveCommentsIssueId} />}
              </>
            )}
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {activeCommentsIssueId && (
          <CommentsModal
            issueId={activeCommentsIssueId}
            currentUser={user}
            onClose={() => setActiveCommentsIssueId(null)}
          />
        )}
      </AnimatePresence>

      {/* Global CSS for no-scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
