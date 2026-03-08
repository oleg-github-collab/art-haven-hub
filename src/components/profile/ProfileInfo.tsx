import { Link } from "react-router-dom";
import { MapPin, LinkIcon, Calendar, BadgeCheck, Edit3, Settings, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n";

interface ProfileInfoProps {
  profile: {
    name: string;
    handle: string;
    bio: string;
    location: string;
    website: string;
    joined: string;
    verified: boolean;
    isOwn: boolean;
    tags: string[];
  };
  following: boolean;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  onToggleFollow: () => void;
}

export default function ProfileInfo({
  profile, following, followerCount, followingCount, postsCount, onToggleFollow,
}: ProfileInfoProps) {
  const { t } = useLanguage();

  return (
    <div className="container max-w-3xl">
      {/* Actions row */}
      <div className="flex items-start justify-between pt-3 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold sm:text-2xl font-serif">
            {profile.isOwn ? t.profile.your_profile : profile.name}
          </h1>
          {profile.verified && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1">
              <BadgeCheck className="h-5 w-5 text-primary" />
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {profile.isOwn ? (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <Edit3 className="h-3.5 w-3.5" />{t.profile.edit}
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant={following ? "outline" : "default"}
                onClick={onToggleFollow}
                className="rounded-full min-w-[100px]"
              >
                {following ? t.profile.unfollow : t.profile.follow}
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-full">
                <Link to="/messenger">
                  <MessageCircle className="h-3.5 w-3.5" />{t.profile.write_msg}
                </Link>
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Handle & bio */}
      <p className="text-sm text-muted-foreground">{profile.handle}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed max-w-xl">{profile.bio}</p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.tags.map((tg) => (
          <Badge key={tg} variant="secondary" className="rounded-full text-xs font-normal px-3">
            #{tg}
          </Badge>
        ))}
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
        <span className="flex items-center gap-1">
          <LinkIcon className="h-3.5 w-3.5" />
          <a href="#" className="text-primary hover:underline">{profile.website}</a>
        </span>
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{t.profile.joined} {profile.joined}</span>
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-6 text-sm">
        {[
          { value: followerCount, label: t.profile.followers },
          { value: followingCount, label: t.profile.following },
          { value: postsCount, label: t.profile.posts },
        ].map((s) => (
          <button key={s.label} className="group hover:text-primary transition-colors">
            <strong className="font-semibold">{s.value.toLocaleString()}</strong>{" "}
            <span className="text-muted-foreground group-hover:text-primary/70">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
