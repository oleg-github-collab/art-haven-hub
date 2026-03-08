import { Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileCoverProps {
  name: string;
  coverColor: string;
  isOwn: boolean;
}

export default function ProfileCover({ name, coverColor, isOwn }: ProfileCoverProps) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <div className="relative">
      {/* Cover with mesh gradient */}
      <div className={`h-44 bg-gradient-to-br ${coverColor} sm:h-56 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--warm-glow)/0.1),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Avatar */}
      <div className="container max-w-3xl">
        <div className="relative -mt-16 sm:-mt-20">
          <div className="relative inline-block">
            <Avatar className="h-28 w-28 border-[5px] border-background shadow-xl sm:h-36 sm:w-36 ring-2 ring-primary/10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold sm:text-4xl font-serif">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOwn && (
              <button className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-3 ring-background transition-transform hover:scale-110">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
