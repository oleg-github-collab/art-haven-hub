import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Paperclip, Smile, MoreVertical, Phone, Video,
  Pin, Users, ArrowLeft, Plus, Mic,
  ChevronDown, Check, CheckCheck, Settings,
  X, MessageCircle, Radio, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sampleChats, currentUserId, type Chat, type ChatMessage } from "@/data/chatData";
import { useLanguage } from "@/i18n";

type Tab = "all" | "private" | "groups" | "channels";

export default function MessengerPage() {
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>(sampleChats);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [searchQ, setSearchQ] = useState("");
  const [msgText, setMsgText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
    { value: "all", label: t.messenger.all, icon: MessageCircle },
    { value: "private", label: t.messenger.private, icon: Lock },
    { value: "groups", label: t.messenger.groups, icon: Users },
    { value: "channels", label: t.messenger.channels, icon: Radio },
  ];

  const activeChat = chats.find((c) => c.id === activeId) || null;

  const filtered = useMemo(() => {
    let list = chats;
    if (tab !== "all") list = list.filter((c) => c.type === tab);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [chats, tab, searchQ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  const sendMessage = () => {
    if (!msgText.trim() || !activeId) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      text: msgText,
      time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: msgText, lastTime: newMsg.time, unread: 0 }
          : c
      )
    );
    setMsgText("");
  };

  const openChat = (id: string) => {
    setActiveId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <aside className={`flex w-full flex-col border-r border-border bg-card sm:w-80 lg:w-96 ${activeChat ? "hidden sm:flex" : "flex"}`}>
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

        <div className="flex gap-1 px-3 pb-2">
          {tabs.map((tb) => (
            <button
              key={tb.value}
              onClick={() => setTab(tb.value)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tab === tb.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <tb.icon className="h-3 w-3" />{tb.label}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 px-2 py-1">
            {filtered.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} active={chat.id === activeId} onClick={() => openChat(chat.id)} />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.messenger.nothing_found}</p>
            )}
          </div>
        </ScrollArea>
      </aside>

      <div className={`flex flex-1 flex-col ${!activeChat ? "hidden sm:flex" : "flex"}`}>
        {activeChat ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setActiveId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{activeChat.avatar}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{activeChat.name}</span>
                  {activeChat.type === "channel" && <Radio className="h-3.5 w-3.5 text-primary" />}
                  {activeChat.type === "group" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeChat.type === "private" && (activeChat.online ? t.messenger.online : t.messenger.was_recently)}
                  {activeChat.type === "group" && `${activeChat.members} ${t.messenger.members}`}
                  {activeChat.type === "channel" && `${activeChat.subscribers?.toLocaleString()} ${t.messenger.subscribers}`}
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 py-4">
              <div className="mx-auto max-w-2xl space-y-3">
                {activeChat.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} chatType={activeChat.type} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {activeChat.type !== "channel" && (
              <div className="border-t border-border px-3 py-3">
                <div className="mx-auto flex max-w-2xl items-end gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="h-4 w-4" /></Button>
                  <div className="relative flex-1">
                    <Input
                      placeholder={t.messenger.write_message}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Mic className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Button size="icon" className="h-9 w-9 shrink-0" disabled={!msgText.trim()} onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t.messenger.select_chat}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t.messenger.select_chat_desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatListItem({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/10" : "hover:bg-accent"}`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarFallback className={`text-xs font-semibold ${chat.type === "channel" ? "bg-primary/15 text-primary" : chat.type === "group" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {chat.avatar}
          </AvatarFallback>
        </Avatar>
        {chat.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            {chat.pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
            <span className="truncate text-sm font-medium">{chat.name}</span>
            {chat.type === "channel" && <Radio className="h-3 w-3 shrink-0 text-primary" />}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">{chat.lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
          {chat.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{chat.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg, chatType }: { msg: ChatMessage; chatType: Chat["type"] }) {
  const isMe = msg.senderId === currentUserId;
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"}`}>
        {!isMe && chatType !== "private" && <p className="mb-0.5 text-[11px] font-semibold text-primary">{msg.senderId}</p>}
        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          <span className="text-[10px]">{msg.time}</span>
          {isMe && (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}
