# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyPA is a PWA personal productivity assistant with AI integration. The app reads from local `ToDo.md` and `Instructions.md` files as the source of truth for task management, following a specific daily section format with Australia/Sydney timezone.

## Development Commands

```bash
# Development
npm run dev                    # Start development server (localhost:5173)
npm run build                  # Production build with type checking
npm run build:safe             # Production build with --skipLibCheck fallback
npm run preview                # Preview production build

# Code Quality
npm run type-check             # TypeScript type checking only
npm run lint                   # ESLint with strict rules
npm run lint:fix               # Auto-fix ESLint issues
npm run format                 # Prettier formatting
npm run format:check           # Check formatting without changes

# Testing & Analysis
npm run test:build             # Full CI pipeline (type-check + lint + build)
npm run build:analyze          # Bundle analysis with vite-bundle-analyzer
npm run lighthouse             # Lighthouse performance testing
npm run audit                  # Security audit

# Deployment
npm run deploy:vercel          # Deploy to Vercel
npm run deploy:netlify         # Deploy to Netlify

# Utilities
npm run clean                  # Remove dist, node_modules, package-lock.json
npm run reinstall              # Clean + fresh install
```

## Architecture

### Dual Architecture Pattern
The app supports two operational modes:
1. **Secure Proxy Mode** (Production): Frontend → Backend API → AI Providers
2. **Direct Mode** (Development): Frontend → AI Providers directly

### Key Service Classes

**AIServiceManager** (`src/services/ai/AIServiceManager.ts`)
- Manages multiple AI providers (Anthropic, OpenAI, Custom Proxy)
- Handles provider switching and configuration
- Abstracts AI interactions across the application

**FileSystemService** (`src/services/fileSystemService.ts`)
- Reads local `ToDo.md` and `Instructions.md` files
- Uses File System Access API with fallbacks
- Handles markdown parsing and file synchronization

**MarkdownParser** (`src/utils/markdownParser.ts`)
- Parses daily sections with format: `# YYYY-MM-DD (Local: Australia/Sydney)`
- Extracts tasks with metadata: `#Project @person Due: YYYY-MM-DD !P1`
- Supports priorities, schedule, follow-ups, notes, completed, blockers

### State Management (Zustand)

**useMarkdownStore** - Main task management
- Auto-loads `ToDo.md` on initialization
- Computes tasks from all daily sections
- Handles CRUD operations with auto-save
- Manages current date (Australia/Sydney timezone)

**useDashboardStore** - Dashboard customization
- Drag-and-drop section management
- Section visibility and positioning
- Persisted layout configuration
- Grid-based positioning system

### Configuration System

**App Config** (`src/config/app.ts`)
- Environment-based configuration with `VITE_*` variables
- Feature flags for offline mode, notifications, file sync
- Timezone configuration (Australia/Sydney default)
- Security settings and API configuration

### Backend API Structure

**Express Server** (`api/src/index.ts`)
- CORS configured for localhost and Vercel deployments
- JWT-based authentication for API access
- Proxy endpoints for secure AI provider access
- Rate limiting and security middleware with Helmet

**AI Proxy Service** (`api/src/services/AIProxyService.ts`)
- Handles API key management server-side
- Routes requests to Anthropic/OpenAI APIs
- Request validation and rate limiting

## File Structure Patterns

### Component Organization
- **Pages**: High-level route components (`Dashboard.tsx`, `Settings.tsx`)
- **Components**: Reusable UI components with specific responsibilities
- **Services**: Business logic and external API integrations
- **Stores**: Zustand state management with persistence
- **Utils**: Helper functions and parsers

### Markdown File Integration
- `public/ToDo.md` - Daily task sections with Australia/Sydney timezone
- `public/Instructions.md` - Assistant behavior guidelines
- Auto-parsing of date sections with metadata extraction
- Task metadata format: `- [ ] Task content #Project @person Due: YYYY-MM-DD !P1`

## Development Notes

### TypeScript Configuration
- Uses strict TypeScript with `--noEmit` for type checking
- Separate configs for app (`tsconfig.app.json`) and Node (`tsconfig.node.json`)
- Import statements require explicit type imports: `import type { Type } from './module'`

### PWA Configuration
- Vite PWA plugin with Workbox for service worker
- Manifest configuration in `vite.config.ts`
- Offline-first caching strategy for markdown files

### Design System
- Tailwind CSS with custom design tokens in `src/styles/design-tokens.css`
- Premium glass morphism effects with `.mypa-glass` utility classes
- Responsive design with mobile-first approach
- Dark mode support with system preference detection

### AI Integration Security
- **Never expose API keys in frontend code**
- Use backend proxy (`apiConfig.baseUrl`) for production
- JWT tokens for backend authentication (`VITE_API_TOKEN`)
- Direct API access only allowed in development mode

### Date Handling
- All dates use Australia/Sydney timezone via `dateUtils.ts`
- Current date calculation: `getCurrentDateAustralian()`
- Markdown sections must match exact date format for parsing

## Common Patterns

### Adding New Dashboard Sections
1. Define section in `useDashboardStore` default layout
2. Create component with `DraggableSection` wrapper
3. Add to dashboard render logic with conditional visibility

### Extending AI Providers
1. Create provider class implementing `AIProvider` interface
2. Register in `AIServiceManager.ts`
3. Add provider type to `types.ts` union
4. Update backend proxy if needed for new API endpoints

### Markdown Section Extensions
1. Update `DailySection` type in `types.ts`
2. Modify `parseMarkdownContent` in `markdownParser.ts`
3. Add export logic in `exportToMarkdown`
4. Update display components to handle new section type