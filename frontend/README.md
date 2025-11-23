# MindCanvas Frontend

Mental mapping application with preference learning, built with modern web technologies.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS (via CSS imports, no PostCSS)
- **tldraw** - Canvas engine for pan, zoom, and interactions
- **Zustand** - Lightweight state management
- **React Bits** - Visual effects (star borders, text animations)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── canvas/        # Canvas components (tldraw wrapper)
│   ├── nodes/         # Concept node components
│   ├── prompt/        # Initial prompt component
│   └── ui/            # UI components (status bar, etc.)
├── hooks/             # Custom React hooks
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Additional styles (if needed)
```

## Setup Notes

- **Tailwind CSS v4**: Configured via CSS imports (`@import "tailwindcss"`) - no PostCSS required
- **Vite 7**: Latest version with React plugin
- **Modern Stack**: All dependencies are up-to-date as of 2025

## Development

The project follows the implementation guide in `MINDCANVAS-STEP-BY-STEP-IMPLEMENTATION.md`.

## Notes

- Some dependencies may show deprecation warnings (e.g., `lodash.isequal`) - these are from transitive dependencies and don't affect functionality
- Tailwind v4 Vite plugin doesn't support Vite 7 yet, so we use CSS imports instead
