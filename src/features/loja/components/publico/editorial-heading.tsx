import { cn } from "@/lib/utils";

type HeadingTag = "h1" | "h2" | "h3";
type HeadingSize = "sm" | "md" | "lg" | "xl";
type HeadingAlign = "left" | "center";

const SIZE_CLASSES: Record<HeadingSize, string> = {
  sm: "text-3xl sm:text-4xl md:text-5xl",
  md: "text-4xl sm:text-5xl md:text-6xl",
  lg: "text-5xl sm:text-6xl md:text-7xl lg:text-8xl",
  xl: "text-6xl sm:text-7xl md:text-8xl lg:text-[10rem]",
};

interface EditorialHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  as?: HeadingTag;
  size?: HeadingSize;
  align?: HeadingAlign;
  className?: string;
}

export function EditorialHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
  size = "lg",
  align = "left",
  className,
}: EditorialHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow mb-4 sm:mb-5">{eyebrow}</span> : null}
      <Tag
        className={cn(
          "text-display uppercase leading-[0.85]",
          SIZE_CLASSES[size],
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-prose text-base text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
