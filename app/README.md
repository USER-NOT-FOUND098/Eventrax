# EventRAX Frontend Application

This directory contains the React frontend application for the EventRAX platform. It is built using modern web development practices to ensure high performance, responsiveness, and aesthetic appeal.

## Technologies Used
- **Framework**: React 18
- **Build Tool**: Vite
- **Typing**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Component Library**: Radix UI primitives with Shadcn UI designs
- **Routing**: React Router DOM
- **Animations**: GSAP (GreenSock) & Framer Motion
- **Icons**: Lucide React

## Development Setup

1. Ensure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Directory Structure
- `src/components/`: Reusable UI elements (buttons, inputs, cards, dialogs).
- `src/components/layout/`: Structural components like `Sidebar`, `Header`, and `AuthModal`.
- `src/components/ui/` & `ui-custom/`: Shadcn and heavily customized complex UI modules.
- `src/contexts/`: Global state providers (`AuthContext`, `ThemeContext`, `SidebarContext`).
- `src/pages/`: Role-based route views (`Admin`, `Creator`, `TeamLead`, `Student`).
- `src/lib/`: Axios API configurations and utility helpers like `cn`.

## Theming
The application supports dynamic theming (`dark`, `light`, `cherry`). Theme preferences are automatically saved to `localStorage`. See `src/contexts/ThemeContext.tsx` and `src/index.css` for implementation details.
