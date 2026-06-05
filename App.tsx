import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  Palette, 
  Plus, 
  Move,
  Sparkles,
  RefreshCw,
  Layers,
  Maximize,
  Layout,
  Clipboard,
  ShieldAlert,
  Trash2,
  Copy,
  Check,
  Zap,
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  Eye,
  Send,
  AlertTriangle,
  Info,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle,
  Upload,
  Video,
  PlaySquare,
  Users,
  Lock,
  Shield
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { PostState, ImageTransform } from './types';
import { INITIAL_STATE, TEAM_THEMES, TEMPLATES, FONTS, URGENT_KEYWORDS } from './constants';
import { getDesignSuggestions, generateSocialCaption } from './services/geminiService';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

const LOGO_STORAGE_KEY = 'sports_designer_persistent_logo';

const MOCK_PROFILE = {
  username: "arsenal_minbar",
  name: "منبر أرسنال",
  followers_count: 184592,
  media_count: 3842,
  biography: "🔴 الحساب الأول لعشاق نادي أرسنال الإنجليزي باللغة العربية.\n📊 تحليلات، عواجل، صفقات، ومتابعة فورية لحظة بلحظة.\n👑 فخورون بدعم الغانرز!",
  profile_picture_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=300&auto=format&fit=crop"
};

const MOCK_MEDIA = [
  {
    id: "post_1",
    caption: "🔴 عاجل: ميكيل أرتيتا يؤكد جاهزية القائد ريكاردو كالافيوري لمواجهة الغد النارية في دوري الأبطال! 🏆✨ #أرسنال #Arsenal",
    media_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-06-05T04:20:00Z",
    like_count: 4281,
    comments_count: 142
  },
  {
    id: "post_2",
    caption: "⚽ الأفضل في البريميرليغ! أرقام مرعبة يحققها جدار دفاعنا صاليبا وغابرييل هذا الموسم. الصلابة الدفاعية هي العنوان الأبرز! 🛡️🔴 #أرسنال #EPL",
    media_url: "https://images.unsplash.com/photo-1540747737956-378724044432?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-06-04T18:30:00Z",
    like_count: 5129,
    comments_count: 204
  },
  {
    id: "post_3",
    caption: "📊 رسمياً: بوكايو ساكا يحصل على جائزة أفضل لاعب في النادي لشهر مايو الماضي بتصويت الجمهور! 🌟👑 مستحق لقائد كتيبة الهجوم. #أرسنال #Saka",
    media_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-06-03T12:15:00Z",
    like_count: 6712,
    comments_count: 310
  },
  {
    id: "post_4",
    caption: "🔴 عواجل الصيف: ديفيد أورنستين يشير لاهتمام ملموس من إدارة أرسنال للتعاقد مع مهاجم بارز وهداف جديد لتعزيز الفعالية الهجومية. 📈✈️ #أرسنال #TransferUpdate",
    media_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-06-02T09:00:00Z",
    like_count: 3982,
    comments_count: 189
  },
  {
    id: "post_5",
    caption: "📸 من تدريبات الغانرز الصباحية اليوم في لندن كولني. الجدية والتركيز عاليان استعدادًا لمنافسات الأسبوع المزدحم! 💪🏴󠁧󠁢󠁥󠁮󠁧󠁿 #أرسنال #Gooners",
    media_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-06-01T15:45:00Z",
    like_count: 4891,
    comments_count: 112
  },
  {
    id: "post_6",
    caption: "👑 المايسترو مارتن أوديغارد يستعرض مهارته الفردية الاستثنائية. عقل الفريق المفكر وأحد ركائز اللعب الحديثة. 🧠🪄 #أرسنال #Odegaard",
    media_url: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=500&auto=format&fit=crop",
    permalink: "https://instagram.com",
    timestamp: "2026-05-31T11:00:00Z",
    like_count: 7301,
    comments_count: 421
  }
];

const getResponsiveFontSize = (text: string, baseSize: number = 48) => {
  if (!text) return baseSize;
  const len = text.length;
  if (len <= 40) return baseSize;
  if (len <= 80) return Math.max(34, Math.round(baseSize * 0.85));
  if (len <= 150) return Math.max(26, Math.round(baseSize * 0.65));
  if (len <= 250) return Math.max(20, Math.round(baseSize * 0.50));
  if (len <= 400) return Math.max(16, Math.round(baseSize * 0.40));
  return Math.max(13, Math.round(baseSize * 0.30));
};

const ALLOWED_EMAILS = [
  "taelimipro@gmail.com",
  "mnbrars@mnbraesenal.com",
  "mnbrarsenal@mnbraesenal.com",
  "mnbr2026@mnbraesenal.com",
  "garsenal@mnbraesenal.com",
  "2mnbrars@mnbraesenal.com",
  "jarsenal@mnbraesenal.com",
  "mn@mnbraesenal.com",
  "ar@mnbraesenal.com",
  "arsenal@mnbraesenal.com",
  "dd9arsenal@mnbraesenal.com",
  "gi@mnbraesenal.com",
  "bn@mnbraesenal.com",
  "kl@mnbraesenal.com"
];

const App: React.FC = () => {
  // Navigation Module View Mode: 'dashboard' | 'designer' | 'publisher'
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'designer' | 'publisher'>('dashboard');

  // Whitelist Register & Login Wall States
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [loginEmailInput, setLoginEmailInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Multi-Section parameters
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'theme' | 'template'>('content');
  const [activeTemplateId, setActiveTemplateId] = useState<string>('breaking');
  const [state, setState] = useState<PostState>(INITIAL_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  
  // Captions & Clipboard
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [pasteTarget, setPasteTarget] = useState<'bg' | 'player' | 'logo'>('bg');
  const previewRef = useRef<HTMLDivElement>(null);

  // Touch / Mouse interactive panning & zooming for Background Image
  const [isPanningBg, setIsPanningBg] = useState(false);
  const bgPanStart = useRef({ x: 0, y: 0, bgX: 0, bgY: 0 });

  // Dashboard States (Real Graph API fallbacks to Mock)
  const [profileData, setProfileData] = useState<any>(null);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [apiSuccess, setApiSuccess] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Publisher Workspace states
  const [publisherTab, setPublisherTab] = useState<'image' | 'reel'>('image');
  const [publishImageSource, setPublishImageSource] = useState<string | null>(null);
  const [publishCaption, setPublishCaption] = useState<string>("");
  const [isAISourceLoading, setIsAISourceLoading] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<'idle' | 'preparing' | 'uploading' | 'submitting' | 'done' | 'error'>('idle');
  const [publishingMessage, setPublishingMessage] = useState<string>("");
  const [livePostUrl, setLivePostUrl] = useState<string>("");

  // Reels specific states
  const [reelsVideoSource, setReelsVideoSource] = useState<string | null>(null);
  const [reelsCaption, setReelsCaption] = useState<string>("#أرسنال #منبر_أرسنال_نيوز #Arsenal #COYG #Gooners");
  const [reelsPublishingStatus, setReelsPublishingStatus] = useState<'idle' | 'preparing' | 'uploading' | 'submitting' | 'done' | 'error'>('idle');
  const [reelsPublishingMessage, setReelsPublishingMessage] = useState<string>("");
  const [reelsLivePostUrl, setReelsLivePostUrl] = useState<string>("");

  // Verify & Load Whitelist session on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
      setState(prev => ({ ...prev, logoImage: savedLogo }));
    }
    
    const savedEmail = localStorage.getItem("allowed_user_email");
    if (savedEmail) {
      const emailFormatted = savedEmail.trim().toLowerCase();
      if (ALLOWED_EMAILS.includes(emailFormatted)) {
        setCurrentUserEmail(emailFormatted);
      } else {
        localStorage.removeItem("allowed_user_email");
        setCurrentUserEmail(null);
      }
    }
    setCheckingAuth(false);
    fetchInstagramProfileData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    const emailSanitized = loginEmailInput.trim().toLowerCase();
    if (!emailSanitized) {
      setLoginError("يرجى إدخال البريد الإلكتروني أولاً.");
      return;
    }

    if (!ALLOWED_EMAILS.includes(emailSanitized)) {
      setLoginError("عذراً، هذا البريد الإلكتروني غير مسموح له بالدخول. يرجى التواصل معنا عبر إنستغرام لطلب التصريح.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Lazy trace/seed in Firebase Firestore for active login records as requested!
      try {
        await setDoc(doc(db, "allowed_users", emailSanitized), {
          email: emailSanitized,
          createdAt: new Date().toISOString(),
          addedBy: "Platform Hardcoded Whitelist Policy"
        });
      } catch (dbErr) {
        console.warn("Firestore logging trace skipped:", dbErr);
      }
      localStorage.setItem("allowed_user_email", emailSanitized);
      setCurrentUserEmail(emailSanitized);
    } catch (err: any) {
      console.error("Login tracking error:", err);
      // Since local check passed, we let them in even if firestore write fails
      localStorage.setItem("allowed_user_email", emailSanitized);
      setCurrentUserEmail(emailSanitized);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("allowed_user_email");
    setCurrentUserEmail(null);
    setLoginEmailInput("");
    setLoginError("");
    setCurrentSection("dashboard");
  };

  const fetchInstagramProfileData = async () => {
    setIsLoadingProfile(true);
    setIsLoadingMedia(true);
    try {
      const pRes = await fetch("/api/instagram/profile");
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfileData(pData);
        setApiSuccess(true);
      } else {
        setProfileData(MOCK_PROFILE);
      }

      const mRes = await fetch("/api/instagram/recent-media");
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData && mData.data) {
          setRecentMedia(mData.data);
        } else {
          setRecentMedia(MOCK_MEDIA);
        }
      } else {
        setRecentMedia(MOCK_MEDIA);
      }
    } catch (err) {
      console.warn("Instagram dynamic load failed. Working on mock mode.", err);
      setProfileData(MOCK_PROFILE);
      setRecentMedia(MOCK_MEDIA);
      setApiSuccess(false);
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingMedia(false);
    }
  };

  const handleStageStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsPanningBg(true);
    bgPanStart.current = {
      x: clientX,
      y: clientY,
      bgX: state.bgTransform.x,
      bgY: state.bgTransform.y
    };
  };

  const handleStageMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (!(previewRef.current as any).lastPinchDist) {
        (previewRef.current as any).lastPinchDist = dist;
      } else {
        const factor = dist / (previewRef.current as any).lastPinchDist;
        const newScale = Math.min(4, Math.max(0.5, state.bgTransform.scale * (factor > 1 ? 1.015 : 0.985)));
        setState(prev => ({
          ...prev,
          bgTransform: { ...prev.bgTransform, scale: newScale }
        }));
        (previewRef.current as any).lastPinchDist = dist;
      }
      return;
    }

    if (!isPanningBg) return;

    if ('touches' in e) {
      e.preventDefault();
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - bgPanStart.current.x;
    const dy = clientY - bgPanStart.current.y;

    const scaleFactor = 1 / (window.innerWidth < 768 ? 0.22 : 0.52);

    setState(prev => ({
      ...prev,
      bgTransform: {
        ...prev.bgTransform,
        x: Math.round(bgPanStart.current.bgX + dx * scaleFactor),
        y: Math.round(bgPanStart.current.bgY + dy * scaleFactor)
      }
    }));
  };

  const handleStageEnd = () => {
    setIsPanningBg(false);
    if (previewRef.current) {
      delete (previewRef.current as any).lastPinchDist;
    }
  };

  const handleStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomIntensity = 0.05;
    const delta = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(4, Math.max(0.5, state.bgTransform.scale + delta * zoomIntensity));
    setState(prev => ({
      ...prev,
      bgTransform: { ...prev.bgTransform, scale: newScale }
    }));
  };

  const handleImageDimensionsAdjustment = (imageUrl: string) => {
    // Keep user's chosen canvas resolution intact, just reset background transformations to center standard
    setState(prev => ({
      ...prev,
      bgTransform: { x: 0, y: 0, scale: 1 }
    }));
  };

  // Paste Content Directly
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (pasteTarget === 'bg') {
              setState(prev => ({ ...prev, bgImage: result }));
              handleImageDimensionsAdjustment(result);
            }
            if (pasteTarget === 'player') setState(prev => ({ ...prev, playerImage: result }));
            if (pasteTarget === 'logo') {
              setState(prev => ({ ...prev, logoImage: result }));
              localStorage.setItem(LOGO_STORAGE_KEY, result);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, [pasteTarget]);

  useEffect(() => {
    window.addEventListener('mouseup', handleStageEnd);
    window.addEventListener('touchend', handleStageEnd);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('mouseup', handleStageEnd);
      window.removeEventListener('touchend', handleStageEnd);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'player' | 'logo' | 'publish') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'bg') {
          setState(prev => ({ ...prev, bgImage: result }));
          handleImageDimensionsAdjustment(result);
        }
        if (type === 'player') setState(prev => ({ ...prev, playerImage: result }));
        if (type === 'logo') {
          setState(prev => ({ ...prev, logoImage: result }));
          localStorage.setItem(LOGO_STORAGE_KEY, result);
        }
        if (type === 'publish') {
          setPublishImageSource(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setState(prev => ({ ...prev, logoImage: null }));
    localStorage.removeItem(LOGO_STORAGE_KEY);
  };

  // Export static images locally
  const generatePngBlobUrl = async (): Promise<string | null> => {
    if (!previewRef.current) return null;
    try {
      return await htmlToImage.toPng(previewRef.current, { pixelRatio: 2 });
    } catch (err) {
      console.error("Failed to compile canvas picture", err);
      return null;
    }
  };

  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = format === 'png' 
        ? await htmlToImage.toPng(previewRef.current, { pixelRatio: 2 })
        : await htmlToImage.toJpeg(previewRef.current, { pixelRatio: 2, quality: 0.95 });
      
      const link = document.createElement('a');
      link.download = `sports-post-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed', error);
      alert('حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  // Setup template configuration details
  const applyTemplate = (tplId: string) => {
    setActiveTemplateId(tplId);
    if (tplId === 'breaking') {
      setState(prev => ({
        ...prev,
        urgentText: 'عاجل',
        quoteText: 'ميكيل أرتيتا يؤكد جاهزية الفريق لخوض القمة الاستثنائية بكل حماس وشغف أمام الخصم الصعب!',
        quoteTextStyle: {
          ...prev.quoteTextStyle,
          fontSize: 48,
          alignment: 'right',
          color: '#ffffff',
          shadow: true
        }
      }));
    } else if (tplId === 'quote') {
      setState(prev => ({
        ...prev,
        urgentText: 'تصريح مهم',
        quoteText: "«أريد دائماً تقديم أفضل ما لدي لمساعدة الفريق وإسعاد الجماهير الوفية في منبر أرسنال الذين يساندوننا على الدوام.»",
        quoteTextStyle: {
          ...prev.quoteTextStyle,
          fontSize: 42,
          alignment: 'center',
          color: '#ffffff',
          shadow: true
        }
      }));
    } else if (tplId === 'match') {
      setState(prev => ({
        ...prev,
        urgentText: 'موعد المباراة القادمة',
        quoteText: 'أرسنال ⚔️ مانشستر سيتي\n🏟️ ملعب الاتحاد | 🗓️ الأحد القادم\n⏰ الساعة 6:30 مساءً بتوقيت مكة المكرمة.',
        quoteTextStyle: {
          ...prev.quoteTextStyle,
          fontSize: 38,
          alignment: 'center',
          color: '#DBFE60',
          shadow: true
        }
      }));
    } else if (tplId === 'minimal') {
      setState(prev => ({
        ...prev,
        urgentText: 'أرسنال',
        quoteText: 'شغف، انتماء، وتاريخ يُكتب بقلوب حمراء وبيضاء على أرض المستطيل الأخضر لمجد لا ينتهي.',
        quoteTextStyle: {
          ...prev.quoteTextStyle,
          fontSize: 36,
          alignment: 'right',
          color: '#ffffff',
          shadow: false
        }
      }));
    }
  };

  // Generate Instagram Captions via Gemini AI
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const caption = await generateSocialCaption(state.urgentText, state.quoteText);
      setGeneratedCaption(caption);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Generate Caption specifically for Publisher
  const handleGeneratePublisherCaption = async () => {
    setIsAISourceLoading(true);
    try {
      const textToUse = publishCaption || state.quoteText || "أخبار أرسنال اليوم";
      const caption = await generateSocialCaption("منبر أرسنال", textToUse);
      setPublishCaption(caption);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAISourceLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Redirect Designed Image straight to Instagram Direct Posting workspace
  const handleTransferToPublisher = async () => {
    setIsExporting(true);
    const compiledUrl = await generatePngBlobUrl();
    setIsExporting(false);
    if (compiledUrl) {
      setPublishImageSource(compiledUrl);
      setPublishCaption(`${state.urgentText ? `🔴 ${state.urgentText} \n\n` : ''}${state.quoteText}\n\n#أرسنال #Arsenal #Gooners #منبر_أرسنال_نيوز`);
      setCurrentSection('publisher');
    } else {
      alert("يرجى المحاولة مجدداً، لم يتم رصد تصميم للتصدير.");
    }
  };

  // Publish direct to Instagram account via Graph API Secure Route
  const handlePublishToInstagram = async () => {
    if (!publishImageSource) {
      alert("يرجى تعيين أو استيراد تصميم لتتمكن من نشره.");
      return;
    }

    setPublishingStatus('preparing');
    setPublishingMessage("جاري تحضير مصفوفة الصورة ومعايرتها للنشر...");

    try {
      await new Promise(r => setTimeout(r, 1000));
      setPublishingStatus('uploading');
      setPublishingMessage("جاري تشفير التصميم بصيغة PNG ورفعه للمزامنة مع خوادم Meta...");

      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUri: publishImageSource,
          caption: publishCaption,
          publicOrigin: window.location.origin
        })
      });

      setPublishingStatus('submitting');
      setPublishingMessage("جاري إنشاء حاوية الوسائط وجدولة المنشور الرياضي حالياً...");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشل طلب النشر الداخلي لدى Meta.");
      }

      setLivePostUrl(result.permalink || "https://www.instagram.com/arsenal_minbar/");
      setPublishingStatus('done');
      setPublishingMessage("تهانينا! 🎉 تم نشر صورتك الرياضية بنجاح على حساب منبر أرسنال بشكل رسمي.");
      
      // Refresh feed
      fetchInstagramProfileData();

    } catch (err: any) {
      console.error("Publishing workflow error", err);
      setPublishingStatus('error');
      setPublishingMessage(`فشل النشر: ${err.message || "حدث خطأ غير متوقع في الاتصال بالشبكة."}`);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert("يرجى اختيار ملف فيديو صحيح بصيغة MP4 أو MOV.");
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      alert("حجم الفيديو كبير جداً. يرجى اختيار فيديو أقل من 80 ميغابايت لتسهيل المعالجة الفورية.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReelsVideoSource(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishReelToInstagram = async () => {
    if (!reelsVideoSource) {
      alert("يرجى اختيار أو رفع فيديو ريلز أولاً.");
      return;
    }

    setReelsPublishingStatus('preparing');
    setReelsPublishingMessage("جاري تهيئة خوادم التلقيم لتحميل الفيديو المرفق...");

    try {
      await new Promise(r => setTimeout(r, 1000));
      setReelsPublishingStatus('uploading');
      setReelsPublishingMessage("جاري رفع ملف الفيديو وتجهيزه للبث على خوادم Meta (قد يستغرق ذلك بضع ثوانٍ)...");

      const response = await fetch("/api/instagram/publish-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoDataUri: reelsVideoSource,
          caption: reelsCaption,
          publicOrigin: window.location.origin
        })
      });

      setReelsPublishingStatus('submitting');
      setReelsPublishingMessage("جاري معالجة المنشور ومزامنته داخلياً في منصة Instagram...");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشل معالجة الفيديو من قِبل Meta.");
      }

      setReelsLivePostUrl(result.permalink || "https://www.instagram.com/arsenal_minbar/reels/");
      setReelsPublishingStatus('done');
      setReelsPublishingMessage("تهانينا! 🎉 تم نشر فيديو الريلز بنجاح على حساب منبر أرسنال!");
      
      fetchInstagramProfileData();

    } catch (err: any) {
      console.error("Reel publishing error", err);
      setReelsPublishingStatus('error');
      setReelsPublishingMessage(`فشل نشر الريلز: ${err.message || "حدث خطأ أثناء معالجة الفيديو."}`);
    }
  };

  const updateTransform = (type: 'bg' | 'player', field: keyof ImageTransform, value: number) => {
    const transformKey = type === 'bg' ? 'bgTransform' : 'playerTransform';
    setState(prev => ({
      ...prev,
      [transformKey]: { ...prev[transformKey], [field]: value }
    }));
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100 font-cairo" dir="rtl">
        <RefreshCw className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-300">جاري التحقق من الصلاحيات والاتصال بقاعدة البيانات...</p>
      </div>
    );
  }

  if (!currentUserEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-cairo px-4 py-12" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-600/15 to-transparent rounded-full pointer-events-none blur-3xl" />
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-600 mx-auto flex items-center justify-center shadow-lg shadow-red-600/20 transition-all duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">منصة منبر أرسنال الرقمية</h2>
              <p className="text-xs text-slate-400 font-medium font-sans">نظام التحقق والتصريح الفوري الموحد 🔴⚪</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 block text-right">أدخل البريد الإلكتروني للمتابعة:</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  className="w-full text-xs font-bold p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-right placeholder-slate-600 text-white font-sans"
                  placeholder="name@example.com"
                  required
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs font-bold text-red-500 text-right leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/40 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isLoggingIn ? "جاري التحقق من الصلاحيات..." : "تسجيل الدخول الآمن"}
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-5 space-y-3 text-center">
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              ⚠️ عذراً، لا يُسمح بالدخول إلا لأصحاب البريد الإلكتروني المدرجين بقائمة المصرح لهم مسبقاً من قِبل الإدارة.
            </p>
            
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 space-y-2 text-center">
              <p className="text-[11px] text-amber-400 font-extrabold">
                طلب إذن الوصول أو تعديل الصلاحيات:
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                لطفا، تواصل معنا فوراً لمضاهاة حسابك وتصريحه مباشرة عبر إنستغرام:
              </p>
              <a 
                href="https://www.instagram.com/mnbrars/"
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:underline hover:text-red-300 font-black"
              >
                <Instagram className="w-3.5 h-3.5" />
                @mnbrars 🔗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-cairo select-none" dir="rtl">
      
      {/* Platform Branded Header bar */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              منبر أرسنال
              <span className="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded-full">Suite v2.5</span>
            </h1>
            <p className="text-xs text-amber-400 font-bold">منصة الإدارة الفورية والإنستغرام التلقائي 🔴⚪</p>
          </div>
        </div>

        {/* Global Hub Navigation Selector */}
        <nav className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-2xl gap-1">
          <button
            onClick={() => setCurrentSection('dashboard')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              currentSection === 'dashboard' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Instagram className="w-4 h-4" />
            حساب منبر أرسنال المدعم 📊
          </button>
          
          <button
            onClick={() => setCurrentSection('designer')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              currentSection === 'designer' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            قسم المصمم الرياضي 🎨
          </button>
          
          <button
            onClick={() => setCurrentSection('publisher')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              currentSection === 'publisher' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            منصة النشر والتلقيم 🚀
          </button>
        </nav>

        {/* Status indicator info & Log Out of session */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black text-rose-500 font-sans" title="حسابك الحالي">
              {currentUserEmail}
            </span>
            <span className="text-[8px] font-extrabold text-slate-400">
              {apiSuccess ? "مباشر بالـ API" : "التحكم التلقائي النشط"}
            </span>
          </div>
          <button 
            type="button"
            onClick={handleLogout}
            className="text-[9px] px-2 py-1 bg-red-600/20 hover:bg-red-600/90 text-red-400 hover:text-white border border-red-900/30 rounded-lg font-black transition-all cursor-pointer mr-1"
            title="تسجيل الخروج من الحساب"
          >
            خروج 🚪
          </button>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 overflow-hidden relative">

        {/* SECTION 1: INSTAGRAM MOCKUP DASHBOARD */}
        {currentSection === 'dashboard' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950 py-10 px-4 md:px-12 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              
              {/* Instagram Branded Header Dashboard Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-600/10 to-transparent rounded-full pointer-events-none blur-3xl" />
                
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative">
                  
                  {/* Story-ringed profile avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center animate-spin-slow shadow-xl">
                      <div className="w-full h-full rounded-full bg-slate-950 p-1">
                        <img 
                          src={profileData?.profile_picture_url || MOCK_PROFILE.profile_picture_url} 
                          className="w-full h-full object-cover rounded-full border border-slate-800" 
                          alt="Avatar" 
                        />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-2 bg-red-600 text-[10px] font-black text-white px-2 py-0.5 rounded-full border-2 border-slate-900">
                      LIVE
                    </span>
                  </div>

                  {/* Profile info & statistics */}
                  <div className="flex-1 text-center md:text-right space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-3 justify-start">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        @{profileData?.username || MOCK_PROFILE.username}
                      </h2>
                      <span className="bg-blue-500 text-white rounded-full p-1 shadow-md shadow-blue-500/20" title="موثق">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      
                      <div className="flex gap-2 mr-0 md:mr-4">
                        <button 
                          onClick={() => setCurrentSection('designer')}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/10"
                        >
                          <Palette className="w-3.5 h-3.5" /> صمم للإنستغرام
                        </button>
                        <a 
                          href="https://www.instagram.com/arsenal_minbar/" 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 p-2 rounded-xl text-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-center md:justify-start gap-10 py-2 border-y border-slate-800/50">
                      <div className="text-center md:text-right">
                        <span className="block text-lg font-black text-white">
                          {(profileData?.media_count || MOCK_PROFILE.media_count).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">المنشورات</span>
                      </div>
                      <div className="text-center md:text-right">
                        <span className="block text-lg font-black text-white">
                          {(profileData?.followers_count || MOCK_PROFILE.followers_count).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">المتابعين</span>
                      </div>
                      <div className="text-center md:text-right">
                        <span className="block text-lg font-black text-white">24</span>
                        <span className="text-[10px] font-bold text-slate-400">المتابَعين</span>
                      </div>
                    </div>

                    {/* Biography details */}
                    <div className="space-y-1">
                      <p className="text-sm text-slate-200 font-extrabold">{profileData?.name || MOCK_PROFILE.name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                        {profileData?.biography || MOCK_PROFILE.biography}
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Instagram post feeds grid wrapper */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Layout className="w-5 h-5 text-red-500" />
                    خلاصة منبر أرسنال الحالية (Instagram Media Feed)
                  </h3>
                  <button 
                    onClick={fetchInstagramProfileData}
                    className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 rounded-lg"
                    title="تحديث البيانات"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingMedia ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <RefreshCw className="w-10 h-10 animate-spin text-red-500" />
                    <p className="text-sm font-black animate-pulse">جاري سحب خلاصة ووسائط الحساب...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {recentMedia.map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="aspect-square bg-slate-900 border border-slate-800/30 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-slate-700/60 transition-all shadow-xl"
                      >
                        {/* Feed post image content */}
                        <img 
                          src={post.media_url || post.thumbnail_url} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          alt="Instagram item" 
                        />
                        
                        {/* Interactive Stats Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6">
                          <div className="flex opacity-100 items-center gap-2 text-white font-black text-sm">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                            {post.like_count || Math.floor(Math.random() * 3000) + 1200}
                          </div>
                          <div className="flex opacity-100 items-center gap-2 text-white font-black text-sm">
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                            {post.comments_count || Math.floor(Math.random() * 150) + 40}
                          </div>
                        </div>

                        {/* Top banner overlay indicatory */}
                        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur text-[9px] font-black px-2 py-0.5 rounded-full text-slate-300 border border-slate-800">
                          {post.media_type === "VIDEO" ? "ريلز" : "منشور"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: PROFESSIONAL POST DESIGNER */}
        {currentSection === 'designer' && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950">
            
            {/* Sidebar Controls Panel */}
            <div className="w-full md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0">
              
              {/* Tab Navigation buttons */}
              <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
                {[
                  { id: 'content', icon: <TypeIcon />, label: 'المحتوى والخبر' },
                  { id: 'style', icon: <Layers />, label: 'المقاس والتحكم' },
                  { id: 'theme', icon: <Palette />, label: 'الألوان الغانرز' },
                  { id: 'template', icon: <Layout />, label: 'القالب والنمط' }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setActiveTab(tb.id as any)}
                    className={`flex-1 py-4 flex flex-col items-center gap-1.5 text-[10px] font-black transition-all ${
                      activeTab === tb.id 
                        ? 'text-red-500 border-b-2 border-red-500 bg-red-950/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="w-4 h-4">{tb.icon}</span>
                    {tb.label}
                  </button>
                ))}
              </div>

              {/* Scrollable controls list */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                
                {/* Content Configuration tab */}
                {activeTab === 'content' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-black text-slate-300 mb-2">العنوان الصغير (Box Text)</label>
                      <input
                        type="text"
                        value={state.urgentText}
                        onChange={(e) => setState(prev => ({ ...prev, urgentText: e.target.value }))}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-right font-black mb-3 text-white"
                        placeholder="عاجل، خبر، تصريح..."
                      />
                      <div className="flex flex-wrap gap-2">
                        {URGENT_KEYWORDS.map(kw => (
                          <button
                            key={kw}
                            onClick={() => setState(prev => ({ ...prev, urgentText: kw }))}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors ${
                              state.urgentText === kw 
                                ? 'bg-red-600 text-white' 
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 mb-2">نص الخبر أو التصريح</label>
                      <textarea
                        value={state.quoteText}
                        onChange={(e) => setState(prev => ({ ...prev, quoteText: e.target.value }))}
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-right h-40 font-extrabold text-white text-base leading-relaxed"
                        placeholder="أدخل نص الخبر هنا..."
                      />
                    </div>

                    {/* Quick paste interface */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3 text-slate-300">
                        <Clipboard className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-black">خاصية اللصق السريع (Ctrl+V)</span>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { id: 'bg', label: 'خلفية' },
                          { id: 'player', label: 'لاعب' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setPasteTarget(t.id as any)}
                            className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all ${
                              pasteTarget === t.id 
                                ? 'bg-red-600 text-white border-red-600 shadow-md' 
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            استهدف {t.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2 font-bold text-center">حدد العنصر أعلاه ثم الصق الصورة في أي مكان بالصفحة</p>
                    </div>

                    {/* Upload Inputs */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-2">الخلفية</label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 hover:border-red-500 rounded-2xl cursor-pointer bg-slate-900/40 transition-colors">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                            <span className="text-[9px] text-slate-400 mt-1 font-bold">رفع خلفية للتصميم</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-2">اللاعب (PNG)</label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 hover:border-red-500 rounded-2xl cursor-pointer bg-slate-900/40 transition-colors">
                            <Plus className="w-5 h-5 text-slate-500" />
                            <span className="text-[9px] text-slate-400 mt-1 font-bold">إضافة لاعب مفرغ</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'player')} />
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Alignment & Scales control tab */}
                {activeTab === 'style' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <section className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                        <ImageIcon className="w-4 h-4 text-red-500" /> تحريك وتكبير الخلفية
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">التكبير (Zoom)</span><span className="text-white font-bold">{state.bgTransform.scale.toFixed(2)}x</span></div>
                          <input type="range" min="0.5" max="3" step="0.01" value={state.bgTransform.scale} onChange={(e) => updateTransform('bg', 'scale', parseFloat(e.target.value))} className="w-full accent-red-600" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">تحريك أفقي (X)</span><span className="text-white font-bold">{state.bgTransform.x}px</span></div>
                          <input type="range" min="-1000" max="1000" value={state.bgTransform.x} onChange={(e) => updateTransform('bg', 'x', parseInt(e.target.value))} className="w-full accent-red-600" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">تحريك عمودي (Y)</span><span className="text-white font-bold">{state.bgTransform.y}px</span></div>
                          <input type="range" min="-1000" max="1000" value={state.bgTransform.y} onChange={(e) => updateTransform('bg', 'y', parseInt(e.target.value))} className="w-full accent-red-600" />
                        </div>
                      </div>
                    </section>

                    <section className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Plus className="w-4 h-4 text-red-500" /> تحريك وتكبير اللاعب
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">حجم اللاعب</span><span className="text-white font-bold">{state.playerTransform.scale.toFixed(2)}x</span></div>
                          <input type="range" min="0.1" max="3" step="0.01" value={state.playerTransform.scale} onChange={(e) => updateTransform('player', 'scale', parseFloat(e.target.value))} className="w-full accent-red-600" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">تحريك أفقي (X)</span><span className="text-white font-bold">{state.playerTransform.x}px</span></div>
                          <input type="range" min="-1500" max="1500" value={state.playerTransform.x} onChange={(e) => updateTransform('player', 'x', parseInt(e.target.value))} className="w-full accent-red-600" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-400">تحريك عمودي (Y)</span><span className="text-white font-bold">{state.playerTransform.y}px</span></div>
                          <input type="range" min="-1500" max="1500" value={state.playerTransform.y} onChange={(e) => updateTransform('player', 'y', parseInt(e.target.value))} className="w-full accent-red-600" />
                        </div>
                      </div>
                    </section>

                    <section className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Maximize className="w-4 h-4 text-red-500" /> أبعاد ونسب التصميم الرياضي
                      </h3>
                      <div className="space-y-4">
                        <span className="text-[10px] text-slate-400 block font-black">اختر مقاس أو نسبة المنشور:</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setState(prev => ({ ...prev, width: 1080, height: 1080 }))}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                              state.width === 1080 && state.height === 1080
                                ? 'bg-red-950/30 border-red-500 text-white shadow-lg'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-xs font-black">نسبة 1:1 (مربع)</span>
                            <span className="text-[9px] text-slate-500 font-bold">1080 × 1080 بكسل</span>
                          </button>
                          <button
                            onClick={() => setState(prev => ({ ...prev, width: 1080, height: 1350 }))}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                              state.width === 1080 && state.height === 1350
                                ? 'bg-red-950/30 border-red-500 text-white shadow-lg'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-xs font-black">نسبة 4:5 (عامودي)</span>
                            <span className="text-[9px] text-slate-500 font-bold">1080 × 1350 بكسل</span>
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* Arsenal customized theme selector tab */}
                {activeTab === 'theme' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-2xl">
                      <p className="text-[11px] text-red-400 font-black leading-relaxed">
                        🔴 تم استبعاد الفرق الأخرى بالكامل. تقتصر التشكيلة ومفاتيح الألوان والأطقم أدناه على أزياء نادي أرسنال ومدرجات ملعب الإمارات فقط لتسهيل وتثبيت هويتك البصرية.
                      </p>
                    </div>

                    <h3 className="text-xs font-black text-amber-400 flex items-center gap-1.5 pt-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      أطقم وبدائل أرسنال (Gunners Identity)
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {TEAM_THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setState(prev => ({ ...prev, theme: t }))}
                          className={`p-4 bg-slate-950 border rounded-2xl flex items-center justify-between transition-all ${
                            state.theme.id === t.id 
                              ? 'border-red-500 ring-2 ring-red-500/50 bg-slate-900' 
                              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1.5">
                              <div className="w-5 h-5 rounded-full border border-slate-950 shadow-md" style={{ backgroundColor: t.primary }} />
                              <div className="w-5 h-5 rounded-full border border-slate-950 shadow-md" style={{ backgroundColor: t.secondary }} />
                              <div className="w-5 h-5 rounded-full border border-slate-950 shadow-md" style={{ backgroundColor: t.accent }} />
                            </div>
                            <span className="text-xs font-black text-white">{t.name}</span>
                          </div>
                          
                          {state.theme.id === t.id && (
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Style Design Templates tab */}
                {activeTab === 'template' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <p className="text-[11px] text-slate-400 font-medium">
                      اختر نمطاً مسبقاً لتلقيم وتنسيق محتوى النص والحجر الأساسي:
                    </p>
                    
                    <div className="space-y-3">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl.id)}
                          className={`w-full p-4 border rounded-2xl text-right transition-all group ${
                            activeTemplateId === tpl.id 
                              ? 'bg-red-950/20 border-red-500 shadow-md' 
                              : 'bg-slate-950 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-black text-xs ${activeTemplateId === tpl.id ? 'text-red-400' : 'text-slate-200 group-hover:text-white'}`}>
                              {tpl.name}
                            </span>
                            {activeTemplateId === tpl.id ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 group-hover:bg-slate-700" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{tpl.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Sidebar Action CTAs Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2 shrink-0">
                <button 
                  onClick={handleTransferToPublisher}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25"
                >
                  <Instagram className="w-4 h-4" />
                  متابعة إلى النشر والتلقيم المباشر ✈️
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleExport('png')}
                    disabled={isExporting}
                    className="py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    حفظ PNG
                  </button>
                  <button 
                    onClick={() => handleExport('jpeg')}
                    disabled={isExporting}
                    className="py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    حفظ JPEG
                  </button>
                </div>
              </div>

            </div>

            {/* Preview Stage Wrapper */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative custom-scrollbar bg-slate-950">
              
              {/* Outer shell that sets the physical dimensions of the container scaled down */}
              <div 
                className="shrink-0 transition-shadow shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
                style={{ 
                  width: state.width * (window.innerWidth < 768 ? 0.22 : 0.52), 
                  height: state.height * (window.innerWidth < 768 ? 0.22 : 0.52),
                }}
              >
                {/* Scaled translation workspace */}
                <div 
                  style={{
                    transform: `scale(${window.innerWidth < 768 ? 0.22 : 0.52})`,
                    transformOrigin: 'top left',
                    width: state.width,
                    height: state.height,
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  {/* The actual unscaled 1:1 canvas for pixel-perfect export */}
                  <div 
                    ref={previewRef}
                    onMouseDown={handleStageStart}
                    onMouseMove={handleStageMove}
                    onMouseUp={handleStageEnd}
                    onMouseLeave={handleStageEnd}
                    onTouchStart={handleStageStart}
                    onTouchMove={handleStageMove}
                    onTouchEnd={handleStageEnd}
                    onWheel={handleStageWheel}
                    className="relative bg-black overflow-hidden w-full h-full cursor-grab active:cursor-grabbing select-none"
                    style={{ 
                      width: state.width, 
                      height: state.height,
                    }}
                  >
                
                {/* Background image item rendering with full cover */}
                {state.bgImage && (
                  <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
                    <img 
                      src={state.bgImage} 
                      className="absolute w-full h-full object-cover" 
                      style={{ 
                        transform: `translate(${state.bgTransform.x}px, ${state.bgTransform.y}px) scale(${state.bgTransform.scale})`,
                        transformOrigin: 'center center'
                      }}
                      alt="Background" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Arsenal Styled Overlay color bands */}
                    <div 
                      className="absolute inset-0 opacity-80" 
                      style={{ 
                        background: `linear-gradient(to top, ${state.theme.primary} 0%, rgba(0,0,0,0.5) 45%, transparent 100%)`,
                      }} 
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                )}

                {/* Player image rendering */}
                {state.playerImage && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-end justify-center">
                    <img 
                      src={state.playerImage} 
                      className="max-h-[110%] object-contain" 
                      style={{ 
                        transform: `translate(${state.playerTransform.x}px, ${state.playerTransform.y}px) scale(${state.playerTransform.scale})`,
                        transformOrigin: 'bottom center'
                      }}
                      alt="Player" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Static Fixed Arsenal Minbar Official Logo at Top Right */}
                <div className="absolute top-12 right-12 z-30 flex items-center justify-center p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-none">
                  <img 
                    src="https://res.cloudinary.com/dng2gcpf3/image/upload/v1780553342/%D8%A7%D8%B1%D8%B3%D9%86%D8%A7%D9%84_png_yophls.png" 
                    className="w-20 h-20 object-contain drop-shadow-lg" 
                    alt="منبر أرسنال" 
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Small Static Username/Handle Watermark at the Bottom Left */}
                <div className="absolute bottom-12 left-12 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 select-none pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-black tracking-wider text-slate-100 font-sans">@mnbrars</span>
                </div>

                {/* Template Layout Text Drawing Renderer */}
                {activeTemplateId === 'breaking' && (
                  <div className="absolute inset-0 flex flex-col justify-end p-16 md:p-20 z-20 pointer-events-none pb-24">
                    
                    {/* Box Title */}
                    <div className="mb-6 flex">
                      <span 
                        className="px-8 py-2.5 text-white font-black skew-x-[-12deg] text-3xl shadow-[5px_5px_15px_rgba(0,0,0,0.6)] border-r-[10px] border-white"
                        style={{ backgroundColor: state.theme.accent }}
                      >
                        <span className="skew-x-[12deg] inline-block uppercase tracking-wider">{state.urgentText}</span>
                      </span>
                    </div>

                    {/* Main title bar quote text */}
                    <div className="flex items-start gap-6">
                      <div className="p-1 w-2.5 self-stretch rounded-full" style={{ backgroundColor: state.theme.secondary }} />
                      <p 
                        style={{ 
                          fontSize: `${getResponsiveFontSize(state.quoteText, state.quoteTextStyle.fontSize)}px`,
                          color: state.quoteTextStyle.color,
                          fontFamily: state.quoteTextStyle.fontFamily,
                          textAlign: state.quoteTextStyle.alignment,
                          fontWeight: state.quoteTextStyle.fontWeight,
                          textShadow: state.quoteTextStyle.shadow ? '0 4px 15px rgba(0,0,0,1)' : 'none',
                          lineHeight: 1.3
                        }}
                        className="max-w-[85%] font-black transition-all duration-300"
                      >
                        {state.quoteText}
                      </p>
                    </div>
                  </div>
                )}

                {activeTemplateId === 'quote' && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-16 md:p-24 z-20 pointer-events-none text-center bg-black/25">
                    
                    {/* Decorative quote mark */}
                    <span className="text-8xl font-serif text-amber-400 leading-none h-10 select-none opacity-85">“</span>
                    
                    <p 
                      style={{ 
                        fontSize: `${getResponsiveFontSize(state.quoteText, state.quoteTextStyle.fontSize)}px`,
                        color: state.quoteTextStyle.color,
                        fontFamily: state.quoteTextStyle.fontFamily,
                        textAlign: 'center',
                        fontWeight: '800',
                        textShadow: '0 4px 20px rgba(0,0,0,0.95)',
                        lineHeight: 1.45
                      }}
                      className="max-w-[90%] font-black italic transition-all duration-300"
                    >
                      {state.quoteText}
                    </p>
                    
                    {/* Small branding footer badge */}
                    <div className="mt-8 flex gap-2 items-center bg-red-650 px-4 py-1.5 rounded-full border border-white/20 select-none shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span className="text-[10px] uppercase font-black text-white tracking-widest">
                        {state.urgentText || "تصريح رسمي"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTemplateId === 'match' && (
                  <div className="absolute inset-0 flex flex-col justify-end p-16 md:p-20 z-20 pointer-events-none pb-24">
                    
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl max-w-2xl shadow-2xl relative">
                      <div className="absolute top-2 left-3 flex items-center gap-1.5 text-slate-400 font-bold">
                        <Clock className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[9px] font-black uppercase tracking-wider">MATCHDAY PREVIEW</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        <span className="text-xs font-black text-amber-400">{state.urgentText || "موعد اللقاء"}</span>
                      </div>

                      <pre 
                        style={{ 
                          fontSize: `${getResponsiveFontSize(state.quoteText, state.quoteTextStyle.fontSize - 4)}px`,
                          color: state.quoteTextStyle.color,
                          fontFamily: state.quoteTextStyle.fontFamily,
                          lineHeight: 1.4
                        }}
                        className="font-black text-white whitespace-pre-wrap leading-relaxed text-right transition-all duration-300"
                      >
                        {state.quoteText}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTemplateId === 'minimal' && (
                  <div className="absolute inset-0 flex flex-col justify-between p-16 md:p-20 z-20 pointer-events-none pb-24">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black text-white px-3 py-1 bg-red-600/90 rounded-lg">
                        {state.urgentText}
                      </span>
                    </div>

                    <div className="max-w-4xl self-end mb-12">
                      <p 
                        style={{ 
                          fontSize: `${getResponsiveFontSize(state.quoteText, state.quoteTextStyle.fontSize)}px`,
                          color: state.quoteTextStyle.color,
                          fontFamily: state.quoteTextStyle.fontFamily,
                          textAlign: 'right',
                          fontWeight: '700',
                          lineHeight: 1.3
                        }}
                        className="font-bold border-r-4 border-red-600 pr-5 transition-all duration-300"
                      >
                        {state.quoteText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom luxury highlight bar */}
                <div 
                  className="absolute bottom-0 w-full h-8 z-20" 
                  style={{ 
                    background: `linear-gradient(to right, ${state.theme.primary}, ${state.theme.accent}, ${state.theme.primary})`,
                  }}
                />
                  </div>
                </div>
              </div>

              {/* Tips banner floating on canvas stage */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-905/90 border border-slate-800 px-6 py-2.5 rounded-full backdrop-blur text-[10px] font-black text-slate-300 shadow-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                تحريك باللمس أو السحب 🖱️ • كبِّر وصغِّر الخلفية بالنقر أو العجلات 🔍
              </div>

            </div>

          </div>
        )}

        {/* SECTION 3: DIRECT INSTAGRAM PUBLISHER */}
        {currentSection === 'publisher' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950 px-4 md:px-12 py-10 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-red-500" />
                    منصة النشر والتلقيم المباشر إلى منبر أرسنال
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    قم بصياغة المنشور التلقائي ونشره على حسابك بشكل حي ومباشر دون استخدام الهاتف.
                  </p>
                </div>

                {/* Content type switching tabs */}
                <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1 w-full md:w-auto shrink-0 select-none" dir="rtl">
                  <button
                    type="button"
                    onClick={() => setPublisherTab('image')}
                    className={`flex-1 md:flex-none py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      publisherTab === 'image' 
                        ? 'bg-red-650 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    بوست صور (Feed Image)
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPublisherTab('reel')}
                    className={`flex-1 md:flex-none py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      publisherTab === 'reel' 
                        ? 'bg-red-650 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    فيديو ريلز (Instagram Reels) 📽️
                  </button>
                </div>
              </div>

              {/* Publisher Dashboard Workspace panel */}
              {publisherTab === 'image' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left block: Media design preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <ImageIcon className="w-4 h-4 text-red-500" />
                      الوسيطة النشطة المراد نشرها
                    </h3>

                    {publishImageSource ? (
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 flex items-center justify-center">
                        <img src={publishImageSource} className="w-full h-full object-contain" alt="Publish source" />
                        
                        <button 
                          onClick={() => setPublishImageSource(null)}
                          className="absolute top-2 right-2 p-2 bg-slate-950/80 text-red-400 hover:text-red-500 rounded-xl border border-slate-800/80 transition-colors"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[300px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/50">
                        <ImageIcon className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-xs font-black text-slate-300">لم يتم اختيار أي محتوى تصميم بعد</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                          بإمكانك استيراد مقاس وتصميم لوحة المصمم الأخيرة، أو رفع صورة مباشرة.
                        </p>

                        <div className="mt-4 flex flex-col gap-2 w-full max-w-[200px]">
                          <button 
                            onClick={handleTransferToPublisher}
                            className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all"
                          >
                            استيراد من المصمم 🎨
                          </button>
                          
                          <label className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all text-center cursor-pointer">
                            رفع صورة من الجهاز
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'publish')} />
                          </label>
                        </div>
                      </div>
                    )}

                    {publishImageSource && (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleTransferToPublisher}
                          className="flex-1 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-black transition-colors"
                        >
                          تحديث التصميم من المصمم 🔄
                        </button>
                        
                        <label className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 text-slate-400 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center">
                          بدّل الصورة
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'publish')} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Right block: Form & settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5">
                    <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <TypeIcon className="w-4 h-4 text-red-500" />
                      كابشن المنشور المرفق
                    </h3>

                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-black text-slate-350">نص الكابشن (Instagram Caption)</label>
                          <button 
                            onClick={handleGeneratePublisherCaption}
                            disabled={isAISourceLoading}
                            className="text-[10px] text-amber-400 font-black flex items-center gap-1 hover:underline disabled:opacity-50"
                          >
                            {isAISourceLoading ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                            صياغة تلقائية بالذكاء الاصطناعي ✨
                          </button>
                        </div>
                        <textarea
                          value={publishCaption}
                          onChange={(e) => setPublishCaption(e.target.value)}
                          className="w-full text-xs p-4 bg-slate-950 border border-slate-800 rounded-2xl h-56 focus:ring-2 focus:ring-red-500 outline-none text-right font-extrabold text-slate-250 leading-relaxed custom-scrollbar"
                          placeholder="أدخل الهاشتاجات وتفاصيل الكابشن للمنشور..."
                        />
                      </div>

                      {/* Hashtag assistant list */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1.5 font-black text-right">هاشتاقات مقترحة سريعة بنقرة واحدة:</span>
                        <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                          {[
                            '#أرسنال',
                            '#منبر_أرسنال',
                            '#Arsenal',
                            '#COYG',
                            '#Gooners',
                            '#الدوري_الانجليزي',
                            '#عاجل',
                            '#أخبار_أرسنال',
                            '#أرتيتا',
                            '#ArsenalNews',
                            '#PremierLeague'
                          ].map((ht) => (
                            <button
                              key={ht}
                              type="button"
                              onClick={() => setPublishCaption(prev => prev + " " + ht)}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-red-950/25 hover:text-red-400 border border-slate-850 hover:border-red-900/50 rounded-xl text-[11px] font-black text-slate-300 transition-all duration-200"
                            >
                              {ht}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Publication settings */}
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                        <span className="text-[10px] text-slate-400 block font-black">نوع ومسار النشر:</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                            <input type="radio" name="ptype" defaultChecked className="accent-red-500" />
                            خلاصة الصور (Single Image Post)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Submission / Progress block */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      {publishingStatus === 'idle' ? (
                        <div className="space-y-2">
                          <button
                            onClick={handlePublishToInstagram}
                            disabled={!publishImageSource}
                            className="w-full py-4 bg-gradient-to-r from-red-650 via-rose-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/40 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <Instagram className="w-4 h-4" />
                            نشر الصور على انستقرام الآن 🚀
                          </button>
                          {publishImageSource && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.download = `sports-post-offline-${Date.now()}.png`;
                                link.href = publishImageSource;
                                link.click();
                              }}
                              className="w-full py-2.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-750 text-xs font-bold rounded-xl transition-colors text-center"
                            >
                              تحميل الصورة كملف PNG للاحتفاظ بها
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={`p-4 border rounded-2xl ${
                          publishingStatus === 'done' 
                            ? 'bg-green-950/20 border-green-800/50' 
                            : publishingStatus === 'error' 
                            ? 'bg-red-950/20 border-red-800/50' 
                            : 'bg-slate-950 border-slate-850'
                        } space-y-3`}>
                          <div className="flex items-center gap-3">
                            {publishingStatus === 'done' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                            {publishingStatus === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
                            {['preparing', 'uploading', 'submitting'].includes(publishingStatus) && (
                              <RefreshCw className="w-5 h-5 text-red-500 animate-spin shrink-0" />
                            )}
                            
                            <div className="text-right">
                              <h4 className="text-xs font-black text-white">حالة النشر والمزامنة الفورية</h4>
                              <p className="text-[10px] text-slate-350 mt-0.5 leading-relaxed">{publishingMessage}</p>
                            </div>
                          </div>

                          {publishingStatus === 'done' && (
                            <div className="pt-1 flex flex-wrap gap-2 justify-end">
                              <a 
                                href={livePostUrl}
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow"
                              >
                                <Instagram className="w-3.5 h-3.5" />
                                معاينة المنشور الحقيقي 🔗
                              </a>
                              <button 
                                onClick={() => setPublishingStatus('idle')}
                                className="px-3 py-2 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                              >
                                نشر صورة أخرى 🔄
                              </button>
                            </div>
                          )}

                          {publishingStatus === 'error' && (
                            <div className="pt-1 text-right">
                              <button 
                                onClick={() => setPublishingStatus('idle')}
                                className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                إلغاء وإعادة المحاولة
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                /* INSTAGRAM REELS WORKSPACE TAB */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Left block: Reels Video file preview selector */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <Video className="w-4 h-4 text-red-500" />
                      فيديو الريلز (Active Reels Video)
                    </h3>

                    {reelsVideoSource ? (
                      <div className="relative aspect-[9/16] max-h-[460px] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 flex flex-col items-center justify-center">
                        <video 
                          src={reelsVideoSource} 
                          controls 
                          className="w-full h-full object-contain"
                          onError={(e) => console.error("Error playing active video source", e)}
                        />
                        
                        <button 
                          onClick={() => setReelsVideoSource(null)}
                          className="absolute top-3 right-3 p-2 bg-slate-950/80 text-red-450 hover:text-red-550 rounded-xl border border-white/5 transition-colors z-10"
                          title="حذف الفيديو"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[320px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/50">
                        <Video className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-xs font-black text-slate-300">لم يتم تعيين أو رفع أي ريلز بعد</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                          قم برفع مقطع فيديو رياضي قصير من جهازك بصيغة MP4 أو MOV لجدولته ونشره كفيديو ريلز مدعوم ومباشر.
                        </p>

                        <div className="mt-4 flex flex-col gap-2 w-full max-w-[200px]">
                          <label className="w-full py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all text-center cursor-pointer shadow-lg shadow-red-950/20 hover:-translate-y-0.5">
                            رفع فيديو من جهازك 🎞️
                            <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right block: Caption & Action settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5">
                    <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <TypeIcon className="w-4 h-4 text-red-500" />
                      كابشن ووسوم الريلز المرفق
                    </h3>

                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-xs font-black text-slate-350 block mb-1.5 text-right">كابشن مقطع الريلز (Reel Caption)</label>
                        <textarea
                          value={reelsCaption}
                          onChange={(e) => setReelsCaption(e.target.value)}
                          className="w-full text-xs p-4 bg-slate-950 border border-slate-800 rounded-2xl h-56 focus:ring-2 focus:ring-red-500 outline-none text-right font-extrabold text-slate-250 leading-relaxed custom-scrollbar"
                          placeholder="اكتب كابشن ووصف الفيديو هنا للوصول إلى جمهور أكبر..."
                        />
                      </div>

                      {/* Hashtag assistant list */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1.5 font-black text-right">هاشتاقات مقترحة سريعة بنقرة واحدة:</span>
                        <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                          {[
                            '#أرسنال',
                            '#منبر_أرسنال',
                            '#Arsenal',
                            '#COYG',
                            '#Gooners',
                            '#الدوري_الانجليزي',
                            '#أخبار_أرسنال',
                            '#أرتيتا',
                            '#ArsenalNews',
                            '#PremierLeague',
                            '#Reels',
                            '#ريلز'
                          ].map((ht) => (
                            <button
                              key={ht}
                              type="button"
                              onClick={() => setReelsCaption(prev => prev + " " + ht)}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-red-950/25 hover:text-red-400 border border-slate-850 hover:border-red-900/50 rounded-xl text-[11px] font-black text-slate-300 transition-all duration-200"
                            >
                              {ht}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                        <span className="text-[10px] text-slate-400 block font-black text-right">موقع ومسار النشر المباشر:</span>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-2 text-xs font-black text-slate-200" dir="rtl">
                            <span className="w-2 h-2 rounded-full bg-red-650 animate-pulse" />
                            بث مباشر إلى قسم Reels حساب منبر أرسنال
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reels Integrated Action / Progress block */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      {reelsPublishingStatus === 'idle' ? (
                        <button
                          onClick={handlePublishReelToInstagram}
                          disabled={!reelsVideoSource}
                          className="w-full py-4 bg-gradient-to-r from-red-650 via-rose-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/40 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <PlaySquare className="w-4 h-4" />
                          نشر مقطع الريلز الآن على انستقرام 🚀
                        </button>
                      ) : (
                        <div className={`p-4 border rounded-2xl ${
                          reelsPublishingStatus === 'done' 
                            ? 'bg-green-950/20 border-green-800/50' 
                            : reelsPublishingStatus === 'error' 
                            ? 'bg-red-950/20 border-red-800/50' 
                            : 'bg-slate-950 border-slate-850'
                        } space-y-3`}>
                          <div className="flex items-center gap-3">
                            {reelsPublishingStatus === 'done' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                            {reelsPublishingStatus === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
                            {['preparing', 'uploading', 'submitting'].includes(reelsPublishingStatus) && (
                              <RefreshCw className="w-5 h-5 text-red-500 animate-spin shrink-0" />
                            )}
                            
                            <div className="text-right">
                              <h4 className="text-xs font-black text-white">حالة معالجة ونشر فيديو الريلز</h4>
                              <p className="text-[10px] text-slate-350 mt-0.5 leading-relaxed">{reelsPublishingMessage}</p>
                            </div>
                          </div>

                          {reelsPublishingStatus === 'done' && (
                            <div className="pt-1 flex flex-wrap gap-2 justify-end">
                              <a 
                                href={reelsLivePostUrl}
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow"
                              >
                                <Instagram className="w-3.5 h-3.5" />
                                معاينة الريلز الحقيقي 🔗
                              </a>
                              <button 
                                onClick={() => setReelsPublishingStatus('idle')}
                                className="px-3 py-2 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                              >
                                نشر مقطع آخر 🔄
                              </button>
                            </div>
                          )}

                          {reelsPublishingStatus === 'error' && (
                            <div className="pt-1 text-right">
                              <button 
                                onClick={() => setReelsPublishingStatus('idle')}
                                className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                إلغاء وإعادة النشر
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
              
            </div>
          </div>
        )}

      </main>

      {/* Post details Dialog Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-xs font-black text-white flex items-center gap-1.5 font-sans">
                <Instagram className="w-4 h-4 text-red-500" />
                تفاصيل منشور انستقرام
              </span>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold bg-slate-900 px-3 py-1 rounded-xl border border-slate-800"
              >
                إغلاق ×
              </button>
            </div>

            <div className="aspect-square w-full border-b border-slate-800/50 bg-slate-950">
              <img 
                src={selectedPost.media_url || selectedPost.thumbnail_url} 
                className="w-full h-full object-contain" 
                alt="Selected post detail img" 
              />
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-800 bg-red-650 overflow-hidden shrink-0">
                  <img src={profileData?.profile_picture_url || MOCK_PROFILE.profile_picture_url} className="w-full h-full object-cover" alt="User avatar" />
                </div>
                <div className="text-right">
                  <span className="block text-xs font-black text-white hover:underline">
                    @{profileData?.username || MOCK_PROFILE.username}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">
                    {new Date(selectedPost.timestamp).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed font-semibold whitespace-pre-wrap text-right">
                {selectedPost.caption || "لا يوجد كابشن للتجربة."}
              </p>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
              <button 
                onClick={() => {
                  setPublishCaption(selectedPost.caption || "");
                  if(selectedPost.media_url) {
                    setPublishImageSource(selectedPost.media_url);
                  }
                  setSelectedPost(null);
                  setCurrentSection('publisher');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة استخدام الكابشن والوسيطة 🔄
              </button>
              
              <a 
                href={selectedPost.permalink || "https://instagram.com"} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center"
              >
                فتح على انستقرام ↗️
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
