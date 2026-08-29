import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  Clock, 
  Download, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Bot,
  Users,
  GripVertical,
  Move,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft
} from 'lucide-react';
import { ChatMessage } from '../types';
import { authFetch } from '../lib/authFetch';

interface SubscriberChatProps {
  currentSpecialtyTitle: string;
}

export const SubscriberChat: React.FC<SubscriberChatProps> = ({ currentSpecialtyTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('د. محمد علي');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: 'image' | 'pdf';
    size: string;
    url: string;
  } | null>(null);

  // Free movement / Dragging position state
  // Default corner is bottom-right (bottom: 20px, right: 20px)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const [isLoading, setIsLoading] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize position once window size is known (default bottom-right, below header)
  useEffect(() => {
    if (position === null && typeof window !== 'undefined') {
      const defaultX = Math.max(12, window.innerWidth - 300);
      const defaultY = Math.max(80, window.innerHeight - 100);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentX = position?.x ?? Math.max(12, window.innerWidth - 300);
    const currentY = position?.y ?? Math.max(80, window.innerHeight - 100);

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: currentX,
      startY: currentY
    };

    setIsDragging(true);
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      let newX = dragStartRef.current.startX + deltaX;
      let newY = dragStartRef.current.startY + deltaY;

      // Bound within screen boundaries (Never allow top < 75px to avoid overlapping top navbar)
      const maxX = Math.max(10, window.innerWidth - (isOpen ? 360 : 220));
      const maxY = Math.max(120, window.innerHeight - (isOpen ? 520 : 60));

      newX = Math.max(10, Math.min(maxX, newX));
      newY = Math.max(75, Math.min(maxY, newY)); // Top offset of 75px prevents header overlap

      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, isOpen]);

  // Quick Corner Position Setters
  const setCornerPosition = (corner: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    const widthOffset = isOpen ? 380 : 240;
    const heightOffset = isOpen ? 520 : 70;

    switch (corner) {
      case 'top-right':
        setPosition({ x: Math.max(10, window.innerWidth - widthOffset - 16), y: 80 });
        break;
      case 'top-left':
        setPosition({ x: 16, y: 80 });
        break;
      case 'bottom-right':
        setPosition({ x: Math.max(10, window.innerWidth - widthOffset - 16), y: Math.max(80, window.innerHeight - heightOffset - 20) });
        break;
      case 'bottom-left':
        setPosition({ x: 16, y: Math.max(80, window.innerHeight - heightOffset - 20) });
        break;
    }
  };

  const lastTimestampRef = useRef<string | null>(null);

  // Fetch initial chat messages
  const fetchMessages = async () => {
    try {
      let url = '/api/chat/messages';
      const params = new URLSearchParams();
      
      if (lastTimestampRef.current) params.append('since', lastTimestampRef.current);
      
      const queryStr = params.toString();
      if (queryStr) url += '?' + queryStr;

      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMessages(prev => {
            const newMsgs = data.filter(d => !prev.some(p => p.id === d.id));
            return [...prev, ...newMsgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
          lastTimestampRef.current = data[data.length - 1].timestamp;
        }
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Fetch immediately when chat bubble is opened
    if (document.visibilityState === 'visible') {
      fetchMessages();
    }

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId && document.visibilityState === 'visible') {
        intervalId = setInterval(fetchMessages, 35000); // 35s interval while open
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle file selection (Images or PDFs up to 50MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('حجم الملف يتجاوز الحد الأقصى المسموح به (50 ميجابايت).');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('يرجى اختيار صورة أو ملف PDF فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      setSelectedFile({
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        size: sizeMb,
        url: resultUrl
      });
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsLoading(true);
    try {
      const payload = {
        senderName: senderName || 'طبيب متدرب',
        senderRole: 'طبيب متدرب',
        senderSpecialty: currentSpecialtyTitle,
        message: newMessage.trim(),
        attachment: selectedFile || undefined
      };

      const res = await authFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdMsg = await res.json();
        setMessages((prev) => [...prev, createdMsg]);
        setNewMessage('');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Purge Media (simulating 04:00 AM Khartoum Purge)
  const handlePurgeMedia = async () => {
    if (!confirm('هل تريد مسح الوسائط والمرفقات من السيرفر الآن بتوقيت الخرطوم للحفاظ على الأداء؟')) return;
    try {
      const res = await authFetch('/api/chat/purge', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPurgeStatus(data.message);
        fetchMessages();
        setTimeout(() => setPurgeStatus(null), 4000);
      }
    } catch (err) {
      console.error('Purge error:', err);
    }
  };

  const stylePosition: React.CSSProperties = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { right: '20px', bottom: '20px' };

  return (
    <div
      style={stylePosition}
      className={`fixed z-50 dir-rtl text-slate-800 font-sans select-none transition-shadow ${
        isDragging ? 'opacity-90 cursor-grabbing scale-102' : ''
      }`}
      dir="rtl"
    >
      {/* Single Clean Floating Chat Toggle Button with Drag Handle */}
      {!isOpen && (
        <div className="flex items-center gap-1 bg-slate-900 border border-emerald-500/80 rounded-full shadow-2xl p-1 font-bold text-xs">
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="p-2 cursor-grab active:cursor-grabbing text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-slate-800 touch-none"
            title="إسحب لتحريك الزر في أي مكان بالشاشة"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="text-white py-1.5 px-3 rounded-full flex items-center gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-300">18 متصل</span>
            </div>

            <span className="text-slate-600">|</span>

            <div className="flex items-center gap-1.5 text-slate-100 font-bold">
              <span>قروب ممتحني ({currentSpecialtyTitle})</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
          </button>

          {/* Quick reset position button if stuck */}
          <button
            onClick={() => setCornerPosition('bottom-right')}
            className="p-1.5 text-slate-400 hover:text-emerald-400 text-[10px] rounded-full hover:bg-slate-800"
            title="إعادة تعيين مكان الزر لأسفل الشاشة"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Floating Chat Window with Draggable Header */}
      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-[94vw] sm:w-[440px] h-[580px] flex flex-col overflow-hidden animate-fadeIn">
          
          {/* Window Header with Movement Controls */}
          <div
            className="p-3 bg-slate-900 text-white flex items-center justify-between cursor-grab border-b border-slate-800"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-800/60 rounded-lg text-emerald-400">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  قروب ممتحني {currentSpecialtyTitle}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400">خاص بطلاب {currentSpecialtyTitle} • MedExam.net</p>
              </div>
            </div>

            {/* Position Preset Buttons + Action Buttons */}
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
              <div className="hidden sm:flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button onClick={() => setCornerPosition('top-right')} className="p-1 text-slate-400 hover:text-emerald-400" title="أعلى اليمين">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCornerPosition('top-left')} className="p-1 text-slate-400 hover:text-emerald-400" title="أعلى اليسار">
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCornerPosition('bottom-right')} className="p-1 text-slate-400 hover:text-emerald-400" title="أسفل اليمين">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCornerPosition('bottom-left')} className="p-1 text-slate-400 hover:text-emerald-400" title="أسفل اليسار">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handlePurgeMedia}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="مسح وسائط المرفقات (04:00 ص)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="إغلاق / تصغير"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Khartoum Time 04:00 AM Purge Notice Banner */}
          <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-1.5 text-[10px] text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold">
              <Clock className="w-3 h-3 text-amber-600" />
              مسح تلقائي للمرفقات 04:00 ص بتوقيت الخرطوم
            </span>
            <span className="text-slate-500">حرية التحريك في أي اتجاه</span>
          </div>

          {purgeStatus && (
            <div className="bg-emerald-100 text-emerald-800 text-xs p-2 text-center border-b border-emerald-300 font-bold">
              {purgeStatus}
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {(() => {
              const displayMsgs = messages.filter((msg) => {
                if (!currentSpecialtyTitle) return true;
                if (msg.senderSpecialty === 'تنويه تلقائي' || msg.senderSpecialty === 'إدارة المجلس') return true;
                return (
                  msg.senderSpecialty.includes(currentSpecialtyTitle) ||
                  currentSpecialtyTitle.includes(msg.senderSpecialty) ||
                  msg.senderName === senderName
                );
              });

              if (displayMsgs.length === 0) {
                return (
                  <div className="text-center py-8 px-4 text-slate-500 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                      💬
                    </div>
                    <p className="font-bold text-xs text-slate-800">
                      مرحباً بكم في قروب ممتحني {currentSpecialtyTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      هذه المساحة مخصصة فقط لمناقشة أسئلة وتجارب امتحان {currentSpecialtyTitle}. كن أول من يشارك سؤالاً أو ملخصاً بالقروب!
                    </p>
                  </div>
                );
              }

              return displayMsgs.map((msg) => {
                const isMe = msg.senderName === senderName;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                      <span className="font-bold text-emerald-800">{msg.senderName}</span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        {msg.senderSpecialty}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed border ${
                        isMe
                          ? 'bg-emerald-600 border-emerald-600 text-white rounded-br-none shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.message && <p>{msg.message}</p>}

                      {/* Attachment Render */}
                      {msg.attachment && (
                        <div className={`mt-2.5 pt-2 border-t ${isMe ? 'border-emerald-500' : 'border-slate-200'}`}>
                          {msg.attachment.type === 'image' ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-40">
                              <img
                                src={msg.attachment.url}
                                alt={msg.attachment.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <a
                              href={msg.attachment.url}
                              download={msg.attachment.name}
                              className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs ${
                                isMe
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate text-[11px] font-mono">{msg.attachment.name}</span>
                              </div>
                              <span className="text-[9px] opacity-80 shrink-0">{msg.attachment.size}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            <div ref={chatBottomRef} />
          </div>

          {/* Attachment Selected Preview bar */}
          {selectedFile && (
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                {selectedFile.type === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-teal-600" />}
                <span className="truncate font-mono">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-500">({selectedFile.size})</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="اسمك كطبيب متدرب..."
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 truncate">التخصص: {currentSpecialtyTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-emerald-600 rounded-xl transition-colors"
                title="إرفاق صورة أو PDF (حتى 50MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="اكتب استفسارك أو مشاركتك الطبية..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={isLoading || (!newMessage.trim() && !selectedFile)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-xs"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </form>

        </div>
      )}

    </div>
  );
};

