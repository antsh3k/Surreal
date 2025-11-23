# 🧠 MindCanvas Development Learnings

This document captures key insights, decisions, and learnings from the MindCanvas project development.

---

## 📦 Package & Dependency Management

### Tailwind CSS v4 Setup (2025)

**Decision**: Use Tailwind CSS v4 with CSS imports instead of PostCSS

**Why**: 
- Tailwind v4 introduces a new CSS-first approach
- The `@tailwindcss/vite` plugin doesn't support Vite 7 yet
- CSS imports (`@import "tailwindcss"`) work natively without PostCSS

**Implementation**:
```css
/* src/index.css */
@import "tailwindcss";
```

**Note**: No `tailwind.config.js` needed initially - Tailwind v4 uses CSS-based configuration.

**Reference**: [Tailwind CSS v4 Documentation](https://tailwindcss.com/blog/tailwindcss-v4)

---

### tldraw Package Structure

**Decision**: Use `Tldraw` component from `tldraw` package (aligned with official docs)

**Why**:
- Official docs recommend `Tldraw` component for simplicity
- `TldrawEditor` was causing context errors (`useCoalescedEvents` undefined)
- `Tldraw` includes all necessary providers and context
- Can hide default UI via CSS while keeping canvas functionality

**API Differences**:
- **High-level**: `Tldraw` component (from `tldraw` package) - full UI included, but can be hidden
- **Low-level**: `TldrawEditor` component (from `@tldraw/tldraw`) - requires additional context providers

**Our Choice**: `Tldraw` with CSS-hidden UI for custom node overlays

**Implementation**:
```tsx
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import './MindCanvas.css'

<Tldraw autoFocus={false}>
  {/* Custom overlays here */}
</Tldraw>
```

**UI Hiding Strategy**:
- Hide default UI elements via CSS (toolbar, menu, navigation)
- Keep canvas functionality (pan, zoom, touch)
- Custom overlays render above canvas with proper z-index

---

### React Bits Integration

**Decision**: Create custom React Bits-style components instead of using npm package

**Why**: 
- The `react-bits` npm package doesn't export the components we need (`StarBorder`, `ShinyText`, `BlurText`)
- Better control over styling and behavior
- No external dependency needed

**Components Created**:
- `StarBorder` - Animated border for high-preference nodes (based on @react-bits/StarBorder-JS-CSS)
- `ShinyText` - Shimmer effect for important text
- `BlurText` - Loading state text effect

**Implementation**:
- Created in `src/components/ui/` directory
- Each component has its own CSS file
- StarBorder uses `as` prop pattern for flexible element rendering

**Integration Challenge**: Z-index and pointer-events

**Solution**: 
- Use `pointer-events-none` on overlay container
- Use `pointer-events-auto` on interactive elements
- Ensure proper z-index stacking (`z-10` for nodes, `z-50` for overlays)

---

## 🛠️ Technical Decisions

### Vite 7 Compatibility

**Issue**: Tailwind v4 Vite plugin doesn't support Vite 7

**Solution**: Use CSS imports directly - works perfectly without plugin

**Status**: ✅ Working with CSS imports

---

### TypeScript Configuration

**Setup**: Standard Vite + React + TypeScript template

**Key Files**:
- `tsconfig.json` - Base TypeScript config
- `tsconfig.app.json` - App-specific config
- `tsconfig.node.json` - Node/build tools config

**Type Definitions**: All interfaces in `src/types/index.ts`

---

### Font Loading

**Decision**: Use Google Fonts for Inter font

**Implementation**:
1. Preconnect in `index.html` for performance
2. Import in CSS: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`
3. Set in CSS: `font-family: 'Inter', system-ui, sans-serif;`

**Why**: Inter is tldraw's default font and provides excellent readability

---

## 🐛 Issues & Solutions

### Deprecation Warnings

**Issue**: `lodash.isequal@4.5.0` deprecated warning

**Cause**: Transitive dependency from `@tldraw/tldraw` or `react-bits`

**Impact**: None - warning only, functionality unaffected

**Action**: Monitor for updates from dependency maintainers

**Node.js Alternative** (for future reference):
```typescript
import { isDeepStrictEqual } from 'node:util'
```

---

### Viewport Configuration

**Issue**: Mobile safe area positioning

**Solution**: Updated viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**Why**: Required for tldraw's safe area features on mobile devices

---

## 🎨 Styling Architecture

### Tailwind CSS v4 Custom Classes

**Pattern**: Use `@layer components` for reusable component styles

**Example**:
```css
@layer components {
  .concept-node {
    @apply px-4 py-2 rounded-lg bg-white shadow-sm cursor-pointer;
    @apply transition-all duration-200 ease-out;
    @apply select-none;
  }
}
```

**Benefits**:
- Reusable across components
- Maintainable in one place
- Type-safe with Tailwind IntelliSense

---

### Animation Strategy

**Approach**: CSS animations + React Bits effects

**CSS Animations**: For loading ripples, node appearance
**React Bits**: For visual polish (star borders, shiny text)

**Keyframes**:
```css
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
```

---

## 📁 Project Structure Decisions

### Component Organization

```
src/components/
├── canvas/        # Canvas wrapper (tldraw integration)
├── nodes/         # Node components (ConceptNode, LoadingNode)
├── prompt/        # Initial prompt UI
├── test/          # Development test components
└── ui/            # General UI components (StatusBar, etc.)
```

**Rationale**: Feature-based organization for scalability

---

### State Management

**Choice**: Zustand

**Why**:
- Lightweight (no providers needed)
- Simple API
- Good TypeScript support
- Perfect for this project's scope

**Pattern**: One store per domain (`mindMapStore`, `uiStore`)

---

## 🚀 Performance Considerations

### Canvas Rendering

**Strategy**: Use tldraw's built-in performance optimizations

**Key Points**:
- tldraw handles viewport culling automatically
- Custom overlays use absolute positioning
- React Bits effects are lightweight

---

### Bundle Size

**Current Dependencies**:
- `@tldraw/tldraw`: ~200KB (gzipped)
- `react-bits`: ~50KB (estimated)
- `zustand`: ~1KB (minimal)

**Optimization**: Tree-shaking works automatically with ES modules

---

## 📚 Resources & References

### Official Documentation
- [tldraw Documentation](https://tldraw.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [React Bits](https://www.npmjs.com/package/react-bits)
- [Zustand](https://github.com/pmndrs/zustand)

### Key Learnings
1. **Tailwind v4**: CSS-first approach eliminates PostCSS complexity
2. **tldraw**: Lower-level API (`TldrawEditor`) provides more flexibility
3. **React Bits**: Works well with proper z-index management
4. **Vite 7**: Latest version works great, but some plugins lag behind

---

## 🔄 Future Considerations

### Potential Improvements
1. **Asset Management**: Consider `@tldraw/assets` for self-hosting if CDN becomes an issue
2. **Performance**: Monitor bundle size as features grow
3. **Mobile**: Test touch interactions thoroughly
4. **Accessibility**: Add ARIA labels and keyboard navigation

### Known Limitations
- Tailwind v4 Vite plugin doesn't support Vite 7 (using CSS imports works fine)
- Some transitive dependencies show deprecation warnings (non-blocking)
- Bundle size warning: tldraw adds ~1.7MB (consider code-splitting for production)

---

## 📝 Development Workflow

### Testing Strategy
1. **Step 2.1**: Verify tldraw canvas loads and renders
2. **Step 2.2**: Test React Bits components render correctly
3. **Step 2.3**: Verify ConceptNode interactions work

### Debugging Tips
- Use `process.env.NODE_ENV === 'development'` for debug overlays
- Check browser console for tldraw initialization messages
- Verify z-index stacking in DevTools

---

**Last Updated**: 2025-01-23
**Project Phase**: Phase 2 - Core Components (Steps 2.1-2.3)

