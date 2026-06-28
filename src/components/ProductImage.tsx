import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { getProductImageUrl, productsKeys } from "@/lib/products";
import { cn } from "@/lib/utils";

interface Props {
  path: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

export function ProductImage({ path, alt, className, iconClassName }: Props) {
  const { data: url } = useQuery({
    queryKey: productsKeys.signedUrl(path ?? ""),
    queryFn: () => getProductImageUrl(path),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  });

  if (path && url) {
    return (
      <img
        src={url}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-secondary text-muted-foreground",
        className,
      )}
    >
      <ImageIcon className={cn("h-5 w-5", iconClassName)} />
    </div>
  );
}
