# 🎨 UI Mockup Generation Prompt

### **Create Multiple Visual Variations of Surreal Mental Maps Interface**

---

## 📋 Design Brief

Create **5 different visual approaches** for Surreal's mental mapping interface. Each mockup should demonstrate the same core functionality with different aesthetic and layout strategies.

### **Core Requirements for All Mockups**

#### **Essential UI Elements**
1. **Topic Input Area**: Text field for initial topic entry
2. **Main Canvas**: Interactive area for node visualization  
3. **Node States**: Visual differentiation for different node types
4. **Preference Indicators**: Subtle color system for learned preferences
5. **Context Menu**: Right-click actions for pragmatic operations
6. **Status/Progress**: User feedback during system operations

#### **Interaction States to Show**
- **Initial State**: Clean interface with topic input
- **First Generation**: 4-5 neutral concept nodes
- **Expanded State**: Hierarchical node relationships  
- **Preference Learning**: Color hints showing system opinions
- **Loading State**: Smooth animations during expansion
- **Context Menu**: Right-click options overlay

---

## 🎯 Mockup Variations to Create

### **Variation 1: Minimalist Geometric** ⭐
**Style**: Ultra-clean, Figma/Linear inspiration
**Layout**: Centered canvas with floating input
**Nodes**: Simple rectangles with rounded corners
**Colors**: Pure white background, #111 text, subtle blue/green accents
**Focus**: Maximum clarity, minimal visual noise

```
Visual Specifications:
- Background: #FFFFFF
- Primary Text: #111111  
- Neutral Borders: #E5E5E5 (1px)
- Dashed Borders: #CCCCCC (1px, dashed)
- Preference Green: #10B981 (10% opacity tint)
- Uncertainty Orange: #F59E0B (10% opacity tint)
- Font: Inter or system-ui, 14px body, 16px headers
- Node Padding: 16px internal, 24px between nodes
- Canvas: Centered, max-width 1200px
```

### **Variation 2: Radial/Organic**
**Style**: Natural, mind-map inspired
**Layout**: Radial expansion from center topic
**Nodes**: Rounded bubbles with organic connections
**Colors**: Warm whites, soft earth tones
**Focus**: Intuitive, brain-like organization

```  
Visual Specifications:
- Background: #FAFAF9
- Node Background: #FFFFFF with soft shadows
- Connections: Curved lines, not straight
- Center Node: Larger, golden accent (#F59E0B)
- Growth Animation: Organic expansion from center
- Typography: Softer fonts, varied sizes
```

### **Variation 3: Technical/Developer**
**Style**: VS Code/GitHub inspired
**Layout**: Sidebar + main area, developer-familiar
**Nodes**: Code-block styling with syntax highlighting
**Colors**: Dark theme option, terminal aesthetics
**Focus**: Appeal to technical users

```
Visual Specifications:
- Background: #1E1E1E or #FFFFFF (toggle)
- Nodes: Code block styling with #F6F8FA background
- Syntax Highlighting: For code-related concepts
- Sidebar: Tree view for navigation
- Monospace: Fira Code for technical content
- Terminal Feel: Slight green tint for actions
```

### **Variation 4: Magazine/Editorial**
**Style**: Apple.com/Medium editorial design
**Layout**: Card-based with rich typography
**Nodes**: Content cards with hierarchy
**Colors**: High contrast, editorial color system
**Focus**: Content readability, visual hierarchy

```
Visual Specifications:
- Typography: Large headers, serif for content
- Cards: Rich shadows, rounded corners
- Color System: Defined brand palette
- Whitespace: Generous padding and margins
- Images: Support for visual content in nodes
- Layout: Magazine-style grid system
```

### **Variation 5: Playful/Creative** 
**Style**: Notion/Figma playful elements
**Layout**: Flexible, creative workspace feel
**Nodes**: Varied shapes, playful interactions
**Colors**: Bright but tasteful accent colors  
**Focus**: Delight, creativity, exploration

```
Visual Specifications:
- Varied Node Shapes: Circles, rounded rects, hexagons
- Playful Animations: Bounce, scale, gentle rotations
- Color Palette: Bright but harmonious accents
- Interactive Elements: Hover effects, micro-animations
- Personality: Friendly but professional
```

---

## 📱 Responsive Considerations

### **Desktop (Primary)**
- Canvas: Full screen utilization
- Nodes: Comfortable sizing for reading
- Context Menus: Standard right-click behavior
- Keyboard: Arrow keys for navigation, space for expansion

### **Mobile/Tablet Adaptation**
- Touch Targets: 44px minimum touch areas
- Gestures: Tap to expand, long-press for context menu
- Layout: Single column, scrollable
- Input: Mobile-optimized keyboard for topic entry

---

## 🎨 Visual States Specification

### **Node Border States**
```css
/* Neutral/Learning */
border: 1px solid #E5E5E5;

/* Expandable/Uncertain */ 
border: 1px dashed #CCCCCC;

/* High Confidence */
border: 1px solid #10B981;

/* User Interest Prediction */
background: rgba(16, 185, 129, 0.05);
border: 1px solid #10B981;

/* Low Relevance Prediction */  
background: rgba(245, 158, 11, 0.05);
border: 1px solid #F59E0B;
```

### **Loading Animations**
- **Node Expansion**: 300ms ease-out scale from 0.8 to 1.0
- **Border Transition**: 200ms color fade between states
- **Text Appearance**: Staggered 50ms delays for child elements
- **Pulse Effect**: Gentle 2s pulse for processing states

### **Context Menu Design**
```
┌─────────────────────────────────┐
│ 🎨 Generate Diagram            │
│ 📄 Create Summary              │  
│ 📹 Find Video                  │
│ ────────────────────────────    │
│ 📌 Pin to Top                  │
│ 🗑️ Remove Branch               │
│ 📤 Export Node                 │
└─────────────────────────────────┘

Style: Soft shadow, rounded corners, 
       300ms fade-in, follows cursor position
```

---

## 🔍 A/B Testing Focus Areas

### **Layout Comparison**
- **Radial vs Linear**: Center-out vs left-to-right expansion
- **Dense vs Spacious**: Information density preferences
- **Fixed vs Fluid**: Structured grid vs organic positioning

### **Color Psychology**  
- **Minimal vs Rich**: Subtle hints vs clear visual feedback
- **Cool vs Warm**: Blue/green vs orange/red preference indicators
- **Light vs Dark**: Background theme preferences

### **Interaction Patterns**
- **Click vs Hover**: Expansion trigger sensitivity
- **Icons vs Text**: Context menu presentation
- **Animation Speed**: User preference for feedback timing

---

## 📊 Mockup Deliverables

### **For Each Variation, Provide:**

1. **Static Mockups**: 3-4 key states (initial, expanded, learning, context)
2. **Interaction Annotations**: Hover states, click targets, transitions
3. **Component Specifications**: Exact measurements, colors, typography
4. **Responsive Breakpoints**: Mobile adaptation strategy
5. **Implementation Notes**: CSS/framework recommendations

### **Evaluation Criteria**

- **Clarity**: Can users understand the interface immediately?
- **Efficiency**: Minimal clicks to achieve core tasks?
- **Delight**: Are there pleasant surprise moments?
- **Scalability**: Works with 5 nodes? 50 nodes?
- **Accessibility**: Screen readers, keyboard navigation, contrast ratios

---

## 🎯 Design Goals for Each Mockup

**Primary Goal**: Enable effortless mental model construction
**Secondary Goal**: Showcase preference learning elegantly  
**Tertiary Goal**: Feel magical, not mechanical

### **Success Metrics for Visual Design**

- **Immediate Comprehension**: User understands within 5 seconds
- **Natural Interaction**: No explanation needed for core actions
- **Visual Hierarchy**: Important elements draw attention appropriately
- **Preference Visibility**: Learning algorithm feels helpful, not intrusive
- **Professional Polish**: Suitable for demo to technical and non-technical audiences

---

## 🚀 Implementation Priorities

**Phase 1**: Choose the variant that best balances simplicity with functionality
**Phase 2**: Implement core interaction patterns from chosen design
**Phase 3**: Add delight moments and polish details
**Phase 4**: Test with real users and iterate

**Remember**: The interface should disappear—users should focus on learning, not on using a tool.