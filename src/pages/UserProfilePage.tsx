import { useState } from "react";
import { useParams } from "react-router-dom";
import ProfileCover from "@/components/profile/ProfileCover";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileTabs from "@/components/profile/ProfileTabs";

interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  joined: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  isOwn: boolean;
  isFollowing: boolean;
  tags: string[];
  coverColor: string;
}

const profiles: Record<string, ProfileData> = {
  me: {
    name: "Your Profile",
    handle: "@you",
    bio: "Artist, curator, dreamer. Creating art that connects people 🎨",
    location: "Berlin, Germany",
    website: "myart.studio",
    joined: "March 2024",
    verified: false,
    followers: 248,
    following: 186,
    posts: 42,
    isOwn: true,
    isFollowing: false,
    tags: ["painting", "ceramics", "installations"],
    coverColor: "from-primary/20 via-accent to-secondary",
  },
  "olena-art": {
    name: "Олена Мирна",
    handle: "@olena.art",
    bio: "Watercolorist 🎨 Painting Carpathians, sea & people. Exhibitions: Berlin, Vienna, Warsaw.\nOriginals & prints in market ↓",
    location: "Vienna, Austria",
    website: "olena-art.com",
    joined: "January 2024",
    verified: true,
    followers: 4820,
    following: 312,
    posts: 156,
    isOwn: false,
    isFollowing: false,
    tags: ["watercolor", "landscape", "portrait"],
    coverColor: "from-blue-500/20 via-primary/10 to-accent/30",
  },
};

const sampleWorks = [
  { id: 1, title: "Winter Morning", likes: 142, comments: 23 },
  { id: 2, title: "Carpathian Fog", likes: 89, comments: 12 },
  { id: 3, title: "Spring Vienna", likes: 234, comments: 45 },
  { id: 4, title: "Night Sea", likes: 178, comments: 31 },
  { id: 5, title: "Old Town", likes: 67, comments: 8 },
  { id: 6, title: "Portrait with Flowers", likes: 312, comments: 56 },
];

const sampleReviews = [
  { author: "Artem K.", text: "Fantastic quality! Received the painting quickly, perfect packaging.", rating: 5 },
  { author: "Maria D.", text: "Very pleasant communication, highly recommend as a seller.", rating: 5 },
];

export default function ProfilePage_() {
  const { handle } = useParams();
  const profileKey = handle || "me";
  const profile = profiles[profileKey] || profiles["me"];

  const [following, setFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followers);

  const toggleFollow = () => {
    setFollowing((f) => !f);
    setFollowerCount((c) => (following ? c - 1 : c + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileCover name={profile.name} coverColor={profile.coverColor} isOwn={profile.isOwn} />
      <ProfileInfo
        profile={profile}
        following={following}
        followerCount={followerCount}
        followingCount={profile.following}
        postsCount={profile.posts}
        onToggleFollow={toggleFollow}
      />
      <ProfileTabs works={sampleWorks} reviews={sampleReviews} isOwn={profile.isOwn} />
    </div>
  );
}
