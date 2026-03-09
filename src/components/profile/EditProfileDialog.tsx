import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n";

interface ProfileFormData {
  name: string;
  bio: string;
  location: string;
  website: string;
  tags: string[];
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
}

export default function EditProfileDialog({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const p = t.profile;

  const [form, setForm] = useState<ProfileFormData>(profile);
  const [newTag, setNewTag] = useState("");

  const handleOpen = (o: boolean) => {
    if (o) setForm(profile);
    onOpenChange(o);
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/^#/, "");
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
    toast({ title: p.profile_saved || "Профіль збережено" });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">{p.edit_profile_title || "Редагувати профіль"}</DialogTitle>
          <DialogDescription>{p.edit_profile_desc || "Змініть інформацію вашого профілю"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border">
                {form.name.charAt(0).toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              {p.change_avatar || "Натисніть для зміни аватара"}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>{p.name_label || "Ім'я"}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label>{p.bio_label || "Біо"}</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="rounded-xl min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{form.bio.length}/200</p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>{p.location_label || "Локація"}</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="rounded-xl"
              placeholder="Berlin, Germany"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label>{p.website_label || "Вебсайт"}</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="rounded-xl"
              placeholder="myart.studio"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>{p.tags_label || "Теги"}</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full text-xs gap-1 pr-1.5">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="rounded-xl"
                placeholder={p.add_tag || "Додати тег..."}
              />
              <Button variant="outline" size="sm" onClick={addTag} className="rounded-full shrink-0">
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            {t.dashboard.cancel}
          </Button>
          <Button onClick={handleSave} className="rounded-full">
            {p.save || "Зберегти"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
