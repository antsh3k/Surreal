# 🏁 Surreal Hackathon Implementation Scope

### **MVP Focus: Core Mental Mapping Experience in 24 Hours**

---

## 🎯 Core MVP Features (Must Have)

### **Day 1 Core (Hours 1-12)**

#### **✅ Essential Features**
- [ ] **Topic Input**: Simple text box → "Learn Active Inference in AI"
- [ ] **Initial Node Generation**: 4-5 concept nodes with neutral styling
- [ ] **Epistemic Expansion**: Click dashed node → 2-4 child nodes appear  
- [ ] **Basic Preference Learning**: Nodes get subtle green/orange tints based on clicks
- [ ] **Simple Visual States**: Dashed (expandable) vs Solid (complete) borders
- [ ] **Loading Animations**: Smooth expand with brief loading indicator

#### **🛠️ Technical Stack (Minimal)**
```
Frontend: React (create-react-app)
Visualization: HTML5 Canvas or SVG (NOT D3.js - too complex)
State Management: Simple useState/useContext
Backend: Single FastAPI endpoint (/expand)
AI: OpenAI GPT-4 API for concept generation  
Styling: Tailwind CSS for rapid development
```

#### **⏱️ Hour-by-Hour Timeline (Day 1)**
- **Hours 1-2**: React setup, basic node rendering, static layout
- **Hours 3-4**: Click handlers, state management, node expansion logic
- **Hours 5-6**: OpenAI integration, real concept generation  
- **Hours 7-8**: Visual states (dashed/solid), preference color tinting
- **Hours 9-10**: Loading animations, smooth UX polish
- **Hours 11-12**: Basic export (PNG screenshot, JSON data)

---

## 🚀 Day 2 Stretch Goals (Hours 13-24)

### **🎨 Enhanced Experience**
- [ ] **Right-Click Context Menu**: "Generate Image", "Generate Video", "Export Node"
- [ ] **Multimedia Nodes**: YouTube video integration (iframe embed)
- [ ] **Smart Suggestions**: "You might want to explore..." based on preferences  
- [ ] **Simple Chat Interface**: "What should I click next?" mini-chatbot
- [ ] **Save/Load Maps**: Local storage for mental map persistence

### **🔧 Technical Enhancements**
- [ ] **Image Generation**: DALL-E integration for concept diagrams
- [ ] **Search Grounding**: Brave API for concept validation (optional)
- [ ] **Better Layouts**: Auto-positioning of nodes to avoid overlaps
- [ ] **Mobile Responsive**: Touch interactions, mobile-friendly layout
- [ ] **Collaboration**: Real-time shared maps (if feeling ambitious)

---

## 📱 Demo Scenarios (Pick 2-3 for Presentation)

### **Scenario 1: Research Assistant** ⭐ (Primary Demo)
**Input**: "Active Inference in AI"  
**Flow**: Shows preference learning, epistemic expansion, smart suggestions
**Audience**: Researchers, students, knowledge workers

### **Scenario 2: Code Understanding** ⭐ (Technical Demo)  
**Input**: "How does Next.js authentication work?"
**Flow**: Code analysis → concept nodes → implementation details
**Audience**: Developers, technical teams

### **Scenario 3: Creative Exploration** (If Time Permits)
**Input**: "History of Jazz Music"
**Flow**: Multimedia integration, YouTube videos → concept spawning  
**Audience**: Educators, creative professionals

---

## 🎪 Key Delight Moments to Nail

### **1. Smart First Impression** 
Topic input → Immediately useful concepts appear → "Wow, it gets it"

### **2. Preference Learning Magic**
After 3-4 clicks → System starts showing green hints → "It's learning what I like!"

### **3. Smooth Expansion**
Click dashed node → Smooth animation → Relevant concepts appear → "This feels natural"

### **4. Right-Click Surprise** (Stretch Goal)
Right-click node → "Generate Image" → Beautiful diagram appears → "This is magic!"

---

## ⚠️ What NOT to Build (Scope Creep Avoidance)

### **❌ Complex Features to Avoid**
- Multi-user real-time collaboration (too complex)
- Advanced AI agents (save for V2)  
- Complex graph algorithms (force-directed layouts, etc.)
- Database persistence (use local storage)
- User authentication (demo-only for now)
- Mobile app (web-first)
- Complex animation libraries (keep it simple)

### **❌ Technical Debt to Avoid**  
- Over-engineering the backend (single endpoint is fine)
- Complex state management (avoid Redux)
- Custom UI components (use existing libraries)
- Premature optimization (make it work, then make it fast)

---

## 🧪 Testing Strategy

### **Manual Testing Checklist**
- [ ] Topic input → concepts appear (core flow)
- [ ] Click expansion works smoothly 
- [ ] Preference colors appear after several clicks
- [ ] Export functionality produces valid output
- [ ] Mobile layout doesn't break completely
- [ ] Loading states don't hang

### **Demo Rehearsal**  
- [ ] 3-minute story: Problem → Solution → Magic moment
- [ ] Backup demo data in case API fails
- [ ] Smooth presentation flow without technical hiccups

---

## 📊 Success Metrics

### **Technical Success**
- ✅ Topic → concepts in <3 seconds
- ✅ Smooth expansion animations  
- ✅ Preference learning visible after 4-5 interactions
- ✅ Zero critical bugs during demo

### **User Experience Success**
- ✅ "I want to use this" reactions
- ✅ Clear understanding of the concept within 30 seconds
- ✅ Visible "aha moments" during preference learning demo
- ✅ Questions about "when can I try this?"

### **Story Success**
- ✅ Clear connection to RL/Post-Training theme
- ✅ Demonstrates novel approach to context management
- ✅ Shows both human and AI applications
- ✅ Memorable demo that stands out from other projects

---

## 🚀 Day-of-Demo Checklist

### **Technical Prep**
- [ ] Backup demo running locally (no internet dependency)
- [ ] Pre-loaded example scenarios
- [ ] Screen recording as backup
- [ ] Multiple API keys (in case of rate limits)

### **Presentation Prep**
- [ ] 2-minute elevator pitch ready
- [ ] Key screenshots for slides
- [ ] Story arc: Problem → Innovation → Impact
- [ ] Q&A prep for technical questions

### **Polish**
- [ ] Clean, professional UI
- [ ] Smooth performance 
- [ ] No console errors
- [ ] Intuitive interactions (no explanation needed)

---

## 🎯 The One Thing That Must Work Perfectly

**Epistemic Expansion with Preference Learning**

If a user can:
1. Enter a topic  
2. Click a dashed concept
3. See relevant new concepts appear
4. Notice the system learning their preferences (green hints)

Then we've succeeded. Everything else is bonus.

**This single interaction demonstrates:**
- Novel RL reward signal (surprise minimization)
- Human-AI collaboration 
- Context management innovation
- Practical utility

---

**Remember: Better to have 3 features that work perfectly than 10 features that are buggy. Focus on the core experience that showcases the innovation.**