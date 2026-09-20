// Reusable brand mark: logo icon + optional wordmark PNG.
// Used in AppHeader (mobile), SideNav (desktop), WelcomePage, etc.
import logoSrc from "@/assets/cropket-logo.png";
import textSrc from "@/assets/cropket-text.png";
import { cn } from "@/lib/utils";

interface Props {
  /** Show the "CropKet" wordmark image next to the logo */
  showText?: boolean;
  /** Extra CSS classes for the wrapping <span> */
  className?: string;
  /** Extra CSS classes for the logo <img> */
  logoClassName?: string;
  /** Extra CSS classes for the text/wordmark <img> */
  textClassName?: string;
}

export default function AppLogo({
  showText = true,
  className,
  logoClassName,
  textClassName,
}: Props) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={logoSrc}
        alt=""
        aria-hidden
        className={cn("h-10 w-10 object-contain", logoClassName)}
      />
      {showText && (
        <img
          src={textSrc}
          alt="CropKet"
          className={cn("h-8 w-auto object-contain", textClassName)}
        />
      )}
    </span>
  );
}
