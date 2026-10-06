import durian from "@/assets/avatars/durian.png.asset.json";
import lemon from "@/assets/avatars/lemon.png.asset.json";
import lychee from "@/assets/avatars/lychee.png.asset.json";
import strawberry from "@/assets/avatars/strawberry.png.asset.json";
import dragonfruit from "@/assets/avatars/dragonfruit.png.asset.json";
import mangosteen from "@/assets/avatars/mangosteen.png.asset.json";
import pear from "@/assets/avatars/pear.png.asset.json";
import { cn } from "@/lib/utils";

/** Team/student fruit icons from Figma; avatar keys are stored as "fruit:<name>". Old emoji values still render as text. */
export const FRUIT_IMAGES: Record<string, string> = {
  "fruit:dragonfruit": dragonfruit.url,
  "fruit:durian": durian.url,
  "fruit:lemon": lemon.url,
  "fruit:lychee": lychee.url,
  "fruit:strawberry": strawberry.url,
  "fruit:mangosteen": mangosteen.url,
  "fruit:pear": pear.url,
};

export function FruitAvatar({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return null;
  const src = FRUIT_IMAGES[value];
  if (src) return <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />;
  return <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>{value}</span>;
}
