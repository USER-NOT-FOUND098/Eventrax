import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    invertContext?: boolean;
}

export function Logo({ className, invertContext = false }: LogoProps) {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <img
                src="/logo/Even logo.svg"
                alt="Eventrax Logo"
                className={cn(
                    "w-full h-full object-contain",
                    invertContext && "brightness-0 invert"
                )}
            />
        </div>
    );
}
