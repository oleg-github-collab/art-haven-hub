import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Paperclip, Smile, MoreVertical, Phone, Video,
  Pin, Users, ArrowLeft, Plus, Mic, MicOff, VideoOff,
  Check, CheckCheck, Settings,
  X, MessageCircle, Radio, Lock,
  Reply, Forward, Copy,
  PhoneOff, Monitor, ExternalLink,
  Image as ImageIcon, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useConversations, useMessages, useSendMessage, useMarkRead, type Conversation, type Message } from "@/hooks/useMessenger";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { useWebRTC, type CallState, type CallInfo, type CoBrowseEvent } from "@/hooks/useWebRTC";
import { useICEServers } from "@/hooks/useICEServers";

type Tab = "all" | "private" | "group" | "channel";

const REACTIONS = [
  { emoji: "❤️", label: "heart" },
  { emoji: "👍", label: "thumbsup" },
  { emoji: "😂", label: "laugh" },
  { emoji: "🔥", label: "fire" },
  { emoji: "😮", label: "wow" },
  { emoji: "😢", label: "sad" },
];

const GIF_CATEGORIES = ["Trending", "Happy", "Sad", "Love", "Funny", "Art", "Dance"];
const SAMPLE_GIFS = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
  "https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif",
  "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
];

const CALL_TYPES = new Set([
  "call_incoming", "call_accepted", "call_rejected", "call_ended",
  "webrtc_offer", "webrtc_answer", "ice_candidate",
  "cobrowse_start", "cobrowse_navigate", "cobrowse_stop",
]);

export default function MessengerPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [searchQ, setSearchQ] = useState("");
  const [msgText, setMsgText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [coBrowseState, setCoBrowseState] = useState<{
    active: boolean;
    url?: string;
    artworkId?: string;
    title?: string;
  }>({ active: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();
  const { data: iceServers } = useICEServers();

  const webrtcHandlerRef = useRef<((msg: WSMessage) => void) | null>(null);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (CALL_TYPES.has(msg.type)) {
      webrtcHandlerRef.current?.(msg);
    }
  }, []);

  const { send: wsSend } = useWebSocket(handleWSMessage);

  const handleCoBrowseEvent = useCallback((event: CoBrowseEvent) => {
    if (event.type === "cobrowse_start") {
      setCoBrowseState({ active: true });
    } else if (event.type === "cobrowse_navigate") {
      setCoBrowseState({ active: true, url: event.url, artworkId: event.artworkId, title: event.title });
    } else if (event.type === "cobrowse_stop") {
      setCoBrowseState({ active: false });
    }
  }, []);

  const {
    callState, callInfo, localStream, remoteStream,
    isMicMuted, isCameraOff, isScreenSharing, callDuration,
    initiateCall, acceptCall, rejectCall, endCall,
    toggleMic, toggleCamera, startScreenShare, stopScreenShare,
    startCoBrowse, stopCoBrowse,
    handleSignalingMessage,
  } = useWebRTC(wsSend, {
    iceServers: iceServers || undefined,
    onCoBrowseEvent: handleCoBrowseEvent,
  });

  useEffect(() => {
    webrtcHandlerRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
    { value: "all", label: t.messenger.all, icon: MessageCircle },
    { value: "private", label: t.messenger.private, icon: Lock },
    { value: "group", label: t.messenger.groups, icon: Users },
    { value: "channel", label: t.messenger.channels, icon: Radio },
  ];

  const activeConv = (conversations || []).find((c) => c.id === activeId) || null;
  const { data: messages } = useMessages(activeId || "");

  const filtered = useMemo(() => {
    let list = conversations || [];
    if (tab !== "all") list = list.filter((c) => c.type === tab);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [conversations, tab, searchQ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = () => {
    if (!msgText.trim() || !activeId) return;
    const content = replyTo
      ? `> ${replyTo.sender?.display_name}: ${replyTo.content.slice(0, 60)}\n\n${msgText}`
      : msgText;
    sendMessage.mutate({ conversationId: activeId, content });
    setMsgText("");
    setReplyTo(null);
  };

  const handleSendGif = (url: string) => {
    if (!activeId) return;
    sendMessage.mutate({ conversationId: activeId, content: url, messageType: "image" });
    setShowGifPicker(false);
  };

  const handleReaction = (msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[msgId] || [];
      if (current.includes(emoji)) {
        return { ...prev, [msgId]: current.filter(e => e !== emoji) };
      }
      return { ...prev, [msgId]: [...current, emoji] };
    });
  };

  const openChat = (id: string) => {
    setActiveId(id);
    markRead.mutate(id);
    setReplyTo(null);
  };

  const getAvatar = (conv: Conversation) => {
    return (conv.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2);
  };

  const handleStartCall = (type: "audio" | "video") => {
    if (!activeConv || activeConv.type !== "private") return;
    const callee = activeConv.members?.find((m) => m.user_id !== user?.id);
    if (callee) {
      initiateCall(callee.user_id, activeConv.id, type);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`flex w-full flex-col border-r border-border bg-card sm:w-80 lg:w-96 ${activeConv ? "hidden sm:flex" : "flex"}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-lg font-bold font-sans">{t.messenger.title}</h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t.messenger.search} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="h-9 pl-9 text-sm" />
          </div>
        </div>

        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
          {tabs.map((tb) => (
            <button
              key={tb.value}
              onClick={() => setTab(tb.value)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tab === tb.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <tb.icon className="h-3 w-3" />{tb.label}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 px-2 py-1">
            {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Завантаження...</p>}
            {filtered.map((conv) => (
              <ChatListItem key={conv.id} conv={conv} avatar={getAvatar(conv)} active={conv.id === activeId} onClick={() => openChat(conv.id)} />
            ))}
            {!isLoading && filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.messenger.nothing_found}</p>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <div className={`flex flex-1 flex-col ${!activeConv ? "hidden sm:flex" : "flex"}`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setActiveId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getAvatar(activeConv)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{activeConv.name || "Chat"}</span>
                  {activeConv.type === "channel" && <Radio className="h-3.5 w-3.5 text-primary" />}
                  {activeConv.type === "group" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeConv.type === "private" && t.messenger.online}
                  {activeConv.type === "group" && `${activeConv.members?.length || 0} ${t.messenger.members}`}
                  {activeConv.type === "channel" && t.messenger.channels}
                </span>
              </div>
              <div className="flex gap-1">
                {activeConv.type === "private" && (
                  <>
                    <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex" onClick={() => handleStartCall("audio")}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex" onClick={() => handleStartCall("video")}>
                      <Video className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-4 w-4" /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {activeConv.type === "private" && (
                      <>
                        <DropdownMenuItem className="sm:hidden" onClick={() => handleStartCall("audio")}>
                          <Phone className="mr-2 h-4 w-4" /> Аудіодзвінок
                        </DropdownMenuItem>
                        <DropdownMenuItem className="sm:hidden" onClick={() => handleStartCall("video")}>
                          <Video className="mr-2 h-4 w-4" /> Відеодзвінок
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="sm:hidden" />
                      </>
                    )}
                    <DropdownMenuItem><Pin className="mr-2 h-4 w-4" /> Закріпити</DropdownMenuItem>
                    <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Учасники</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Co-browse banner */}
            <AnimatePresence>
              {coBrowseState.active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-primary/20 bg-primary/5"
                >
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {coBrowseState.title ? `Перегляд: ${coBrowseState.title}` : "Спільний перегляд галереї"}
                      </span>
                      {coBrowseState.url && (
                        <a href={coBrowseState.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setCoBrowseState({ active: false }); stopCoBrowse(); }}>
                      <X className="mr-1 h-3 w-3" /> Завершити
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="mx-auto max-w-2xl space-y-2">
                {(messages || []).map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.sender_id === user?.id}
                    chatType={activeConv.type}
                    reactions={messageReactions[msg.id] || []}
                    onReaction={(emoji) => handleReaction(msg.id, emoji)}
                    onReply={() => setReplyTo(msg)}
                    onForward={() => setForwardMsg(msg)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply banner */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="flex items-center gap-3 bg-accent/50 px-4 py-2">
                    <Reply className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary">{replyTo.sender?.display_name || "User"}</p>
                      <p className="truncate text-xs text-muted-foreground">{replyTo.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyTo(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input bar */}
            {activeConv.type !== "channel" && (
              <div className="border-t border-border px-3 py-3">
                <div className="mx-auto flex max-w-2xl items-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem><ImageIcon className="mr-2 h-4 w-4" /> Фото / Відео</DropdownMenuItem>
                      <DropdownMenuItem><Paperclip className="mr-2 h-4 w-4" /> Файл</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex-1">
                    <Input
                      placeholder={replyTo ? `Відповідь для ${replyTo.sender?.display_name}...` : t.messenger.write_message}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      className="pr-24"
                    />
                    <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                      <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Gift className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end" side="top">
                          <GifPicker search={gifSearch} onSearchChange={setGifSearch} onSelect={handleSendGif} />
                        </PopoverContent>
                      </Popover>
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="end" side="top">
                          <EmojiPicker onSelect={(emoji) => { setMsgText(prev => prev + emoji); setShowEmojiPicker(false); }} />
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Mic className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Button size="icon" className="h-9 w-9 shrink-0" disabled={!msgText.trim()} onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </motion.div>
            <h2 className="mb-2 text-xl font-semibold">{t.messenger.select_chat}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t.messenger.select_chat_desc}</p>
          </div>
        )}
      </div>

      {/* Call Modal */}
      <CallModal
        callState={callState}
        callInfo={callInfo}
        localStream={localStream}
        remoteStream={remoteStream}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        callDuration={callDuration}
        onEndCall={endCall}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onStartCoBrowse={() => { startCoBrowse(); setCoBrowseState({ active: true }); }}
      />

      {/* Incoming Call Overlay */}
      <IncomingCallOverlay callState={callState} callInfo={callInfo} onAccept={acceptCall} onReject={rejectCall} />

      {/* Forward Modal */}
      <ForwardModal msg={forwardMsg} conversations={conversations || []} onClose={() => setForwardMsg(null)} />
    </div>
  );
}

/* ─── Chat list item ─── */
function ChatListItem({ conv, avatar, active, onClick }: { conv: Conversation; avatar: string; active: boolean; onClick: () => void }) {
  const lastTime = conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/10" : "hover:bg-accent"}`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarFallback className={`text-xs font-semibold ${conv.type === "channel" ? "bg-primary/15 text-primary" : conv.type === "group" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {avatar}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            {conv.is_pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
            <span className="truncate text-sm font-medium">{conv.name || "Chat"}</span>
            {conv.type === "channel" && <Radio className="h-3 w-3 shrink-0 text-primary" />}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">{lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{conv.last_message || ""}</p>
          {conv.unread_count > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{conv.unread_count}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ msg, isMe, chatType, reactions, onReaction, onReply, onForward }: {
  msg: Message; isMe: boolean; chatType: string; reactions: string[];
  onReaction: (emoji: string) => void; onReply: () => void; onForward: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const time = new Date(msg.created_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });

  const isReply = msg.content.startsWith("> ");
  const quotedText = isReply ? msg.content.split("\n\n")[0]?.replace(/^> /, "") : null;
  const actualContent = isReply ? msg.content.split("\n\n").slice(1).join("\n\n") : msg.content;
  const isImage = msg.message_type === "image" || /\.(gif|png|jpg|jpeg|webp)$/i.test(msg.content) || msg.content.includes("giphy.com");

  return (
    <div
      className={`group relative flex ${isMe ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute -top-8 z-10 flex gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-md ${isMe ? "right-0" : "left-0"}`}
          >
            {REACTIONS.slice(0, 4).map((r) => (
              <button key={r.emoji} onClick={() => onReaction(r.emoji)} className="rounded p-1 text-sm hover:bg-accent transition-colors">{r.emoji}</button>
            ))}
            <button onClick={onReply} className="rounded p-1 hover:bg-accent transition-colors"><Reply className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={onForward} className="rounded p-1 hover:bg-accent transition-colors"><Forward className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button className="rounded p-1 hover:bg-accent transition-colors"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`max-w-[75%] ${isImage ? "" : `rounded-2xl px-3.5 py-2 ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"}`}`}>
        {!isMe && chatType !== "private" && msg.sender && (
          <p className={`mb-0.5 text-[11px] font-semibold ${isImage ? "text-foreground" : "text-primary"}`}>{msg.sender.display_name}</p>
        )}

        {quotedText && (
          <div className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-[11px] ${isMe ? "border-primary-foreground/40 bg-primary-foreground/10" : "border-primary bg-primary/5"}`}>
            {quotedText}
          </div>
        )}

        {isImage ? (
          <div className="overflow-hidden rounded-2xl">
            <img src={actualContent} alt="GIF" className="max-h-48 w-auto rounded-2xl object-cover" loading="lazy" />
            <div className="mt-1 flex items-center justify-end gap-1 text-muted-foreground">
              <span className="text-[10px]">{time}</span>
              {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-line">{actualContent}</p>
            <div className={`mt-1 flex items-center justify-end gap-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              <span className="text-[10px]">{time}</span>
              {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
            </div>
          </>
        )}

        {reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {reactions.map((emoji, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-xs cursor-pointer hover:bg-accent/80 transition-colors" onClick={() => onReaction(emoji)}>
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── GIF Picker ─── */
function GifPicker({ search, onSearchChange, onSelect }: { search: string; onSearchChange: (v: string) => void; onSelect: (url: string) => void }) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Пошук GIF..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto p-2 scrollbar-none">
        {GIF_CATEGORIES.map((cat) => (
          <button key={cat} className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground hover:bg-accent transition-colors">
            {cat}
          </button>
        ))}
      </div>
      <ScrollArea className="h-56">
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {SAMPLE_GIFS.map((gif, i) => (
            <button key={i} onClick={() => onSelect(gif)} className="overflow-hidden rounded-lg transition-transform hover:scale-[1.03]">
              <div className="aspect-square bg-secondary animate-pulse rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-muted-foreground/30" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-border px-3 py-1.5 text-center text-[10px] text-muted-foreground">
        Powered by GIPHY
      </div>
    </div>
  );
}

/* ─── Emoji Picker ─── */
function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const emojis = ["😀","😂","🥰","😍","🤩","😎","🤔","😢","😡","🔥","❤️","👍","👎","🎨","🖼️","✨","🌟","💫","🎭","🎪","🎵","📸","💡","🙏","👏","💪","✌️","🤝","🫶","🎉"];
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Емоджі</p>
      <div className="grid grid-cols-8 gap-1">
        {emojis.map((e) => (
          <button key={e} onClick={() => onSelect(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-accent transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Call Modal — Real WebRTC ─── */
function CallModal({
  callState, callInfo, localStream, remoteStream,
  isMicMuted, isCameraOff, isScreenSharing, callDuration,
  onEndCall, onToggleMic, onToggleCamera,
  onStartScreenShare, onStopScreenShare, onStartCoBrowse,
}: {
  callState: CallState; callInfo: CallInfo | null;
  localStream: MediaStream | null; remoteStream: MediaStream | null;
  isMicMuted: boolean; isCameraOff: boolean; isScreenSharing: boolean; callDuration: number;
  onEndCall: () => void; onToggleMic: () => void; onToggleCamera: () => void;
  onStartScreenShare: () => void; onStopScreenShare: () => void; onStartCoBrowse: () => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const showModal = callInfo?.direction === "outgoing"
    ? (callState === "initiating" || callState === "connecting" || callState === "connected" || callState === "ended")
    : (callState === "connecting" || callState === "connected" || callState === "ended");

  if (!showModal || !callInfo) return null;

  const isVideo = callInfo.callType === "video";
  const mins = Math.floor(callDuration / 60).toString().padStart(2, "0");
  const secs = (callDuration % 60).toString().padStart(2, "0");

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden [&>button]:hidden">
        {isVideo && callState === "connected" ? (
          <div className="relative aspect-video bg-black">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted
              className="absolute bottom-4 right-4 h-32 w-24 rounded-lg object-cover border-2 border-white/20 shadow-lg" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {mins}:{secs}
            </div>
          </div>
        ) : (
          <div className={`flex flex-col items-center ${isVideo ? "bg-foreground/95 text-background" : "bg-gradient-to-b from-primary/20 to-background"} p-8`}>
            <motion.div
              animate={callState === "initiating" || callState === "connecting" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {(callInfo.remoteUserName || "?").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">{callInfo.remoteUserName || "User"}</h3>
            <p className={`text-sm mb-8 ${isVideo ? "text-background/60" : "text-muted-foreground"}`}>
              {callState === "initiating" && "Дзвінок..."}
              {callState === "connecting" && "Підключення..."}
              {callState === "connected" && `${mins}:${secs}`}
              {callState === "ended" && "Завершено"}
            </p>
          </div>
        )}

        {callState !== "ended" && (
          <div className="flex items-center justify-center gap-4 py-4 bg-background">
            <Button variant="ghost" size="icon"
              className={`h-12 w-12 rounded-full ${isMicMuted ? "bg-destructive/20 text-destructive" : "bg-accent/50"}`}
              onClick={onToggleMic}>
              {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            {isVideo && (
              <Button variant="ghost" size="icon"
                className={`h-12 w-12 rounded-full ${isCameraOff ? "bg-destructive/20 text-destructive" : "bg-accent/50"}`}
                onClick={onToggleCamera}>
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            )}
            <Button size="icon" className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90" onClick={onEndCall}>
              <PhoneOff className="h-6 w-6 text-destructive-foreground" />
            </Button>
            <Button variant="ghost" size="icon"
              className={`h-12 w-12 rounded-full ${isScreenSharing ? "bg-primary/20 text-primary" : "bg-accent/50"}`}
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}>
              <Monitor className="h-5 w-5" />
            </Button>
            {callState === "connected" && (
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-accent/50" onClick={onStartCoBrowse}>
                <ExternalLink className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Incoming Call Overlay ─── */
function IncomingCallOverlay({ callState, callInfo, onAccept, onReject }: {
  callState: CallState; callInfo: CallInfo | null; onAccept: () => void; onReject: () => void;
}) {
  if (callState !== "ringing" || !callInfo || callInfo.direction !== "incoming") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center rounded-2xl bg-card p-8 shadow-2xl"
      >
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {(callInfo.remoteUserName || "?").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <h3 className="text-xl font-semibold mb-1">{callInfo.remoteUserName || "User"}</h3>
        <p className="text-sm text-muted-foreground mb-8">
          {callInfo.callType === "video" ? "Відеодзвінок..." : "Аудіодзвінок..."}
        </p>
        <div className="flex gap-6">
          <Button size="icon" className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90" onClick={onReject}>
            <PhoneOff className="h-7 w-7 text-destructive-foreground" />
          </Button>
          <Button size="icon" className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600" onClick={onAccept}>
            <Phone className="h-7 w-7 text-white" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Forward Modal ─── */
function ForwardModal({ msg, conversations, onClose }: { msg: Message | null; conversations: Conversation[]; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sendMessage = useSendMessage();

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleForward = () => {
    if (!msg) return;
    selected.forEach((convId) => {
      sendMessage.mutate({ conversationId: convId, content: `↪ Переслано:\n${msg.content}` });
    });
    setSelected(new Set());
    onClose();
  };

  if (!msg) return null;

  return (
    <Dialog open={!!msg} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-sans">Переслати повідомлення</DialogTitle>
        </DialogHeader>
        <div className="mb-3 rounded-lg bg-accent/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">{msg.sender?.display_name}</p>
          <p className="text-sm">{msg.content.slice(0, 100)}{msg.content.length > 100 ? "..." : ""}</p>
        </div>
        <ScrollArea className="max-h-60">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => toggleSelect(conv.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${selected.has(conv.id) ? "bg-primary/10" : "hover:bg-accent"}`}
              >
                <Checkbox checked={selected.has(conv.id)} />
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] font-semibold bg-secondary text-secondary-foreground">
                    {(conv.name || "?").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{conv.name || "Chat"}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <Button className="w-full" disabled={selected.size === 0} onClick={handleForward}>
          <Forward className="mr-2 h-4 w-4" />
          Переслати ({selected.size})
        </Button>
      </DialogContent>
    </Dialog>
  );
}
