import { useState } from "react";
import { useParams } from "react-router-dom";
import ProfileCover from "@/components/profile/ProfileCover";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileTabs from "@/components/profile/ProfileTabs";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { useProfile, useUpdateProfile, useFollow } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useArtworks } from "@/hooks/useArtworks";

export default function ProfilePage_() {
  const { handle } = useParams();
  const { user: currentUser } = useAuth();
  const profileHandle = handle || currentUser?.handle || "";
  const isOwn = !handle || handle === currentUser?.handle;

  const { data: profileUser, isLoading } = useProfile(profileHandle);
  const { data: artworkData } = useArtworks({ artist_id: profileUser?.id, limit: 20 });
  const updateProfile = useUpdateProfile();
  const follow = useFollow();
  const [editOpen, setEditOpen] = useState(false);
  const [following, setFollowing] = useState(false);

  if (isLoading || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  const profileData = {
    name: profileUser.display_name,
    handle: `@${profileUser.handle}`,
    bio: profileUser.bio || "",
    location: [profileUser.city, profileUser.country].filter(Boolean).join(", "),
    website: "",
    joined: new Date(profileUser.id).toLocaleDateString("uk-UA"), // approximate
    verified: (profileUser.roles || []).includes("verified"),
    isOwn,
    tags: [] as string[],
    coverColor: "from-primary/20 via-accent to-secondary",
  };

  const followerCount = profileUser.follower_count || 0;
  const followingCount = profileUser.following_count || 0;
  const postsCount = profileUser.artwork_count || 0;

  const sampleWorks = (artworkData?.items || []).map(a => ({
    id: a.id as any,
    title: a.title,
    likes: a.like_count,
    comments: a.review_count || 0,
  }));

  const toggleFollow = () => {
    follow.mutate({ userId: profileUser.id, isFollowing: following });
    setFollowing(f => !f);
  };

  const handleSaveProfile = (data: { name: string; bio: string; location: string; website: string; tags: string[] }) => {
    updateProfile.mutate({ display_name: data.name, bio: data.bio } as any);
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileCover name={profileData.name} coverColor={profileData.coverColor} isOwn={profileData.isOwn} />
      <ProfileInfo
        profile={profileData}
        following={following}
        followerCount={followerCount}
        followingCount={followingCount}
        postsCount={postsCount}
        onToggleFollow={toggleFollow}
        onEditProfile={() => setEditOpen(true)}
      />
      <ProfileTabs works={sampleWorks} reviews={[]} isOwn={profileData.isOwn} />

      {profileData.isOwn && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            name: profileData.name,
            bio: profileData.bio,
            location: profileData.location,
            website: profileData.website,
            tags: profileData.tags,
          }}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
