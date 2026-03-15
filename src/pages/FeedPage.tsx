import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Repeat2, Bookmark, Send, Image as ImageIcon,
  Smile, MoreHorizontal, BadgeCheck, TrendingUp, Clock, Flame,
  Plus, Search, Filter, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useFeed, useCreatePost, useLikePost, useRepostPost, useBookmarkPost, useComments, useCreateComment, type FeedPost as ApiFeedPost } from "@/hooks/useFeed";
import { useAuth } from "@/contexts/AuthContext";

type SortMode = "hot" | "new" | "top";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} хв`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год`;
  const days = Math.floor(hrs / 24);
  return `${days} д`;
}

export default function FeedPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [sort, setSort] = useState<SortMode>("hot");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");

  const sortMap: Record<SortMode, string> = { hot: "hot", new: "recent", top: "top" };
  const { data: feedPages, isLoading } = useFeed(sortMap[sort]);
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const repostPost = useRepostPost();
  const bookmarkPost = useBookmarkPost();

  const posts = useMemo(() => {
    const all = feedPages?.pages?.flat() || [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.author?.display_name?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [feedPages, search]);

  const sortOpts: { value: SortMode; label: string; icon: React.ElementType }[] = [
    { value: "hot", label: t.feed.hot, icon: Flame },
    { value: "new", label: t.feed.new, icon: Clock },
    { value: "top", label: t.feed.top, icon: TrendingUp },
  ];

  const handlePublish = () => {
    if (!newPostText.trim()) return;
    createPost.mutate({ content: newPostText }, {
      onSuccess: () => {
        setNewPostText("");
        setComposeOpen(false);
      },
    });
  };

  const userInitials = user?.display_name?.split(" ").map(w => w[0]).join("").slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">{t.feed.title}</h1>
          <Button onClick={() => setComposeOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> {t.feed.write}
          </Button>
        </div>

        {/* Search + Sort */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.feed.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {sortOpts.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inline compose */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={t.feed.compose_placeholder}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Button size="sm" disabled={!newPostText.trim() || createPost.isPending} onClick={handlePublish}>
                  {t.feed.publish}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {isLoading && (
            <div className="py-16 text-center text-muted-foreground">
              Завантаження...
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ delay: i * 0.03, duration: 0.35 }}
              >
                <PostCard
                  post={post}
                  onLike={() => likePost.mutate({ id: post.id, isLiked: !!post.is_liked })}
                  onRepost={() => repostPost.mutate({ id: post.id, isReposted: !!post.is_reposted })}
                  onBookmark={() => bookmarkPost.mutate({ id: post.id, isBookmarked: !!post.is_bookmarked })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {!isLoading && posts.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              {t.feed.nothing_found}
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog (mobile-friendly) */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.feed.compose_dialog_title}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={t.feed.compose_dialog_placeholder}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="min-h-[120px] resize-none"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ImageIcon className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Button disabled={!newPostText.trim() || createPost.isPending} onClick={handlePublish}>
              <Send className="mr-1.5 h-4 w-4" /> {t.feed.publish}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Post Card ─── */
function PostCard({
  post,
  onLike,
  onRepost,
  onBookmark,
}: {
  post: ApiFeedPost;
  onLike: () => void;
  onRepost: () => void;
  onBookmark: () => void;
}) {
  const [showComments, setShowComments] = useState(false);

  const initials = (post.author?.display_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <article className="rounded-xl border border-border bg-card transition-all hover:border-border/80 hover:card-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{post.author?.display_name || "User"}</span>
            <span className="text-xs text-muted-foreground">@{post.author?.handle || "user"}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs font-normal">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {post.images && post.images.length > 0 && (
        <div className="px-4 pb-3">
          <img
            src={post.images[0]}
            alt=""
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: 360 }}
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
        <ActionBtn
          icon={Heart}
          count={post.like_count}
          active={!!post.is_liked}
          activeClass="text-red-500"
          onClick={onLike}
        />
        <ActionBtn
          icon={MessageCircle}
          count={post.comment_count}
          active={showComments}
          activeClass="text-primary"
          onClick={() => setShowComments(!showComments)}
        />
        <ActionBtn
          icon={Repeat2}
          count={post.repost_count}
          active={!!post.is_reposted}
          activeClass="text-green-500"
          onClick={onRepost}
        />
        <ActionBtn
          icon={Bookmark}
          count={0}
          active={!!post.is_bookmarked}
          activeClass="text-primary"
          onClick={onBookmark}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <CommentsSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

/* ─── Comments Section ─── */
function CommentsSection({ postId }: { postId: string }) {
  const { data: comments } = useComments(postId);
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState("");

  const addComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({ postId, content: commentText }, {
      onSuccess: () => setCommentText(""),
    });
  };

  return (
    <div className="space-y-3 p-4">
      {(comments || []).map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
              {(c.author?.display_name || "?")[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold">{c.author?.display_name || "User"}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground/90">{c.content}</p>
          </div>
        </div>
      ))}
      {/* Add comment */}
      <div className="flex gap-2 pt-1">
        <Input
          placeholder="Написати коментар..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          className="h-8 text-xs"
        />
        <Button size="sm" className="h-8 px-3" disabled={!commentText.trim() || createComment.isPending} onClick={addComment}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Action Button ─── */
function ActionBtn({
  icon: Icon,
  count,
  active,
  activeClass,
  onClick,
}: {
  icon: React.ElementType;
  count: number;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-accent ${
        active ? activeClass : "text-muted-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
