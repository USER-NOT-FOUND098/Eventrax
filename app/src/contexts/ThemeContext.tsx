import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type Theme = 'dark' | 'light' | 'cherry';
export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const accentColorsMap = {
    indigo: { primary: '#6366F1', secondary: '#818CF8', hover: '#4F46E5', gradientFrom: '#6366F1', gradientTo: '#8B5CF6' },
    emerald: { primary: '#10B981', secondary: '#34D399', hover: '#059669', gradientFrom: '#10B981', gradientTo: '#34D399' },
    amber: { primary: '#F59E0B', secondary: '#FBBF24', hover: '#D97706', gradientFrom: '#F59E0B', gradientTo: '#FBBF24' },
    rose: { primary: '#F43F5E', secondary: '#FB7185', hover: '#E11D48', gradientFrom: '#F43F5E', gradientTo: '#FB7185' },
    violet: { primary: '#8B5CF6', secondary: '#A78BFA', hover: '#7C3AED', gradientFrom: '#8B5CF6', gradientTo: '#A78BFA' },
};

// Comprehensive theme colors for ENTIRE app
const themeColors = {
    dark: {
        // Primary backgrounds
        '--bg-primary': '#07070A',
        '--bg-secondary': '#0E0E12',
        '--bg-tertiary': '#1A1A1F',
        '--bg-card': '#12121A',
        '--bg-sidebar': '#0A0A0F',
        '--bg-header': 'rgba(14, 14, 18, 0.95)',
        '--bg-input': '#1A1A22',
        '--bg-hover': 'rgba(99, 102, 241, 0.1)',

        // Text colors
        '--text-primary': '#FFFFFF',
        '--text-secondary': '#A1A1AA',
        '--text-muted': '#71717A',
        '--text-inverse': '#07070A',

        // Base Accent (Default Indigo)
        '--accent-primary': '#6366F1',
        '--accent-secondary': '#818CF8',
        '--accent-hover': '#7C3AED',
        '--accent-gradient-from': '#6366F1',
        '--accent-gradient-to': '#8B5CF6',

        // Borders
        '--border-color': 'rgba(255, 255, 255, 0.08)',
        '--border-input': 'rgba(255, 255, 255, 0.1)',
        '--border-card': 'rgba(255, 255, 255, 0.05)',

        // Buttons
        '--btn-primary-bg': '#6366F1',
        '--btn-primary-text': '#FFFFFF',
        '--btn-primary-hover': '#5558E3',
        '--btn-secondary-bg': 'rgba(99, 102, 241, 0.15)',
        '--btn-secondary-text': '#A5B4FC',
        '--btn-secondary-hover': 'rgba(99, 102, 241, 0.25)',

        // Status colors
        '--status-success': '#10B981',
        '--status-warning': '#F59E0B',
        '--status-error': '#EF4444',
        '--status-info': '#3B82F6',

        // Shadow
        '--shadow-color': 'rgba(0, 0, 0, 0.5)',
        '--glow-color': 'rgba(99, 102, 241, 0.3)',
    },
    light: {
        // Primary backgrounds
        '--bg-primary': '#F8FAFC',
        '--bg-secondary': '#FFFFFF',
        '--bg-tertiary': '#F1F5F9',
        '--bg-card': '#FFFFFF',
        '--bg-sidebar': '#FFFFFF',
        '--bg-header': 'rgba(255, 255, 255, 0.95)',
        '--bg-input': '#F8FAFC',
        '--bg-hover': 'rgba(99, 102, 241, 0.08)',

        // Text colors
        '--text-primary': '#1E293B',
        '--text-secondary': '#475569',
        '--text-muted': '#94A3B8',
        '--text-inverse': '#FFFFFF',

        // Base Accent
        '--accent-primary': '#6366F1',
        '--accent-secondary': '#818CF8',
        '--accent-hover': '#5558E3',
        '--accent-gradient-from': '#6366F1',
        '--accent-gradient-to': '#8B5CF6',

        // Borders
        '--border-color': 'rgba(0, 0, 0, 0.08)',
        '--border-input': 'rgba(0, 0, 0, 0.12)',
        '--border-card': 'rgba(0, 0, 0, 0.06)',

        // Buttons
        '--btn-primary-bg': '#6366F1',
        '--btn-primary-text': '#FFFFFF',
        '--btn-primary-hover': '#5558E3',
        '--btn-secondary-bg': 'rgba(99, 102, 241, 0.1)',
        '--btn-secondary-text': '#4F46E5',
        '--btn-secondary-hover': 'rgba(99, 102, 241, 0.2)',

        // Status colors
        '--status-success': '#059669',
        '--status-warning': '#D97706',
        '--status-error': '#DC2626',
        '--status-info': '#2563EB',

        // Shadow
        '--shadow-color': 'rgba(0, 0, 0, 0.1)',
        '--glow-color': 'rgba(99, 102, 241, 0.2)',
    },
    cherry: {
        // Pink/White girly aesthetic like VS Code pink themes
        // Primary backgrounds - soft pink tones
        '--bg-primary': '#FFF0F5',        // Lavender blush
        '--bg-secondary': '#FFFFFF',
        '--bg-tertiary': '#FFF5F8',       // Lighter pink
        '--bg-card': '#FFFFFF',
        '--bg-sidebar': '#FFF0F5',
        '--bg-header': 'rgba(255, 240, 245, 0.95)',
        '--bg-input': '#FFFFFF',
        '--bg-hover': 'rgba(236, 72, 153, 0.08)',

        // Text colors - dark for readability
        '--text-primary': '#831843',       // Dark pink/magenta
        '--text-secondary': '#9D174D',     // Medium pink
        '--text-muted': '#BE185D',         // Lighter magenta
        '--text-inverse': '#FFFFFF',

        // Accent colors - vibrant pink
        '--accent-primary': '#EC4899',     // Pink 500
        '--accent-secondary': '#F472B6',   // Pink 400
        '--accent-hover': '#DB2777',       // Pink 600
        '--accent-gradient-from': '#EC4899',
        '--accent-gradient-to': '#F472B6',

        // Borders - subtle pink
        '--border-color': 'rgba(236, 72, 153, 0.15)',
        '--border-input': 'rgba(236, 72, 153, 0.2)',
        '--border-card': 'rgba(236, 72, 153, 0.1)',

        // Buttons - pink accents
        '--btn-primary-bg': '#EC4899',
        '--btn-primary-text': '#FFFFFF',
        '--btn-primary-hover': '#DB2777',
        '--btn-secondary-bg': 'rgba(236, 72, 153, 0.12)',
        '--btn-secondary-text': '#BE185D',
        '--btn-secondary-hover': 'rgba(236, 72, 153, 0.2)',

        // Status colors - harmonized with pink theme
        '--status-success': '#059669',
        '--status-warning': '#F59E0B',
        '--status-error': '#E11D48',       // Rose 600
        '--status-info': '#EC4899',

        // Shadow - pink tinted
        '--shadow-color': 'rgba(236, 72, 153, 0.15)',
        '--glow-color': 'rgba(236, 72, 153, 0.3)',
    },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const location = useLocation();

    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('eventrax-theme');
        return (saved as Theme) || 'dark';
    });

    const [accentColor, setAccentColor] = useState<AccentColor>(() => {
        const saved = localStorage.getItem('eventrax-accent');
        return (saved as AccentColor) || 'indigo';
    });

    useEffect(() => {
        localStorage.setItem('eventrax-theme', theme);
        localStorage.setItem('eventrax-accent', accentColor);

        // Determine effective theme based on route
        const isPublicRoute = ['/login', '/signup', '/'].includes(location.pathname);
        const effectiveTheme = isPublicRoute ? 'light' : theme;

        // Apply CSS variables to root based on EFFECTIVE theme
        const root = document.documentElement;
        let colors = { ...themeColors[effectiveTheme] };

        // Override with selected accent color
        const accent = accentColorsMap[accentColor];
        if (accent && effectiveTheme !== 'cherry') {
            Object.assign(colors, {
                '--accent-primary': accent.primary,
                '--accent-secondary': accent.secondary,
                '--accent-hover': accent.hover,
                '--accent-gradient-from': accent.gradientFrom,
                '--accent-gradient-to': accent.gradientTo,
                '--btn-primary-bg': accent.primary,
                '--btn-primary-hover': accent.hover,
            });
        }

        if (accent) {
            Object.assign(colors, {
                '--accent-primary': accent.primary,
                '--accent-secondary': accent.secondary,
                '--accent-hover': accent.hover,
                '--accent-gradient-from': accent.gradientFrom,
                '--accent-gradient-to': accent.gradientTo,
                '--btn-primary-bg': accent.primary,
                '--btn-primary-hover': accent.hover,
            });
        }

        Object.entries(colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Strip all potential theme class names first
        root.classList.remove('theme-dark', 'theme-light', 'theme-cherry', 'dark', 'light');

        // Add the current effective theme class
        root.classList.add(`theme-${effectiveTheme}`);

        // CRITICAL FIX: Shadcn UI requires the literal 'dark' class for its components
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        }

        // Also set data attributes for easier CSS targeting
        root.setAttribute('data-theme', effectiveTheme);
        root.setAttribute('data-accent', accentColor);
    }, [theme, accentColor, location.pathname]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
