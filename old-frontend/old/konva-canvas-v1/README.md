# 🧠 Surreal Mental Maps - Konva Canvas Implementation

High-performance interactive mental mapping system built with Konva.js and React TypeScript.

## 🚀 Features

### Core Functionality
- **Interactive Topic Input**: Enter any topic to generate initial concept nodes
- **Epistemic Expansion**: Click dashed nodes to explore deeper concepts
- **Preference Learning**: System learns your interests and highlights relevant concepts
- **Content Generation**: Right-click nodes to generate diagrams, summaries, and videos
- **Export Capabilities**: Save mental maps as PNG images or JSON data

### Performance Features
- **60fps Performance**: Smooth animations even with 100+ nodes
- **Viewport Culling**: Only renders visible nodes for optimal performance
- **Mobile Optimization**: Touch gestures, pinch zoom, long-press context menus
- **Memory Management**: Efficient handling of large node datasets
- **Level of Detail**: Reduces visual complexity at different zoom levels

### UX Design
- **Preference Colors**: Green hints for likely interesting content, orange for uncertain
- **Smooth Animations**: 400ms node appearances with staggered child expansions
- **Visual Feedback**: Hover effects, selection states, loading indicators
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Canvas**: Konva.js + react-konva for high-performance rendering
- **State Management**: Zustand for canvas and preference state
- **Styling**: Tailwind CSS + Inter font
- **Build Tool**: Vite for fast development and building
- **Performance**: Custom optimization engine with viewport culling

## 🎯 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

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

### Development Server
Open [http://localhost:5177](http://localhost:5177) to view the application.

## 🎨 Usage Guide

### 1. **Topic Input**
Enter any topic in the initial input screen:
- "Active Inference in AI"
- "History of Jazz Music"  
- "Next.js Authentication"

### 2. **Exploration**
- **Click** dashed-border nodes to expand and explore concepts
- **Right-click** any node to generate content (diagrams, summaries, videos)
- **Scroll** to zoom in/out for different perspectives
- **Drag** to pan around the mental map

### 3. **Preference Learning**
- After 3-4 interactions, the system starts showing color hints
- **Green tint**: Concepts you'll likely find interesting
- **Orange tint**: Uncertain relevance based on your pattern
- **Gray**: Neutral concepts still being evaluated

### 4. **Export & Share**
- Click "Export Map" to download JSON data
- Future: PNG image export for sharing visual mental maps

## 🎭 UX Principles

### **Minimalist Design**
- Clean white background with subtle shadows
- Inter font for excellent readability
- Minimal UI that stays out of the way

### **Progressive Disclosure**
- Start with neutral concepts
- Reveal preferences gradually
- Show complexity only when requested

### **Delightful Interactions**
- Smooth 60fps animations
- Responsive hover effects
- Satisfying click feedback
- "Magic moments" during content generation

## 🧪 Demo Scenarios

### **Research Assistant** (Primary Demo)
Input: "Active Inference in AI"
- Shows preference learning in action
- Demonstrates epistemic expansion
- Highlights smart suggestion system

### **Code Understanding** (Technical Demo)
Input: "Next.js Authentication"  
- Code-focused concept generation
- Implementation detail exploration
- Developer-relevant content suggestions

### **Creative Exploration**
Input: "History of Jazz Music"
- Multimedia content integration
- Cultural/artistic concept mapping
- Timeline-based relationship visualization

## 🎪 Key Innovation: Preference Learning

The core innovation is the **preference learning system** that starts neutral and develops opinions about what will interest you:

1. **Neutral Start**: All concepts begin with equal visual weight
2. **Implicit Feedback**: Your clicks reveal interests and priorities  
3. **Adaptive Hints**: System highlights concepts you're likely to explore
4. **Personalized Paths**: Future explorations adapt to discovered preferences

This creates a **collaborative intelligence** experience where human intuition guides AI processing power.

---

Built with ❤️ for the Surreal Mental Mapping project.
