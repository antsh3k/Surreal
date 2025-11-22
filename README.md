# 🧠 Surreal: The Active-Inference World Model Builder

### **An Interactive Knowledge Graph Engine Powered by Uncertainty Minimization**

> **Problem Statement Alignment:** Statement Two (Reinforcement Learning & Post Training)
> **Core Innovation:** Using Active Inference to build dynamic knowledge graphs where user interaction generates dense reward signals for RL training.

---

## 🌌 The Core Concept

Current Reinforcement Learning (RL) pipelines struggle with two major bottlenecks:
1.  **Environment Design:** Building custom "Gyms" for complex reasoning tasks (like research, coding, or learning) is incredibly resource-intensive.
2.  **Reward Sparsity:** Agents usually only get feedback at the very end of a task (e.g., "Did the tests pass?"), making the learning process slow and inefficient.

**Surreal** is a **General-Purpose RL Engine** that solves this by treating the environment as an **Interactive Knowledge Graph** where every user interaction becomes a training signal.

### **What You'll Experience**

When you use Surreal, you see a **radial, layered graph**:
- **Layer 0:** Your initial topic or goal (the "Self Node")
- **Layer 1:** First-level concepts generated from search, documents, or analysis
- **Layer 2+:** Deeper expansions based on what you explore

**Every click is an RL action:**
- Click a dashed node → expand it (epistemic action: reduce uncertainty)
- Click a concept card → view details, generate content, or prune (pragmatic action: modify the world model)
- Click "Grow Everything" → auto-expand all uncertain nodes

The system uses **Active Inference** to:
- Predict which nodes you'll want to explore next
- Calculate how much each action reduces "surprise" (uncertainty)
- Generate dense reward signals from your natural exploration behavior

### **The Innovation**

Instead of hard-coding rewards, Surreal treats:
- Your goal as a **Prior Belief** (The Self Node)
- Graph expansion as **Policy Actions**
- Uncertainty reduction as the **Reward Signal**

This creates a universal RL environment that works for research, learning, coding, or any knowledge-intensive task.

---

## 📐 Theoretical Framework

Surreal automates the RL lifecycle by providing a universal definition of "Reward" based on Information Theory.

| Standard RL Concept | Surreal Implementation | What the User Sees |
| :--- | :--- | :--- |
| **The Environment** | **Dynamic Knowledge Graph** (MongoDB-backed state space) | Radial graph with expandable nodes |
| **The Constraint** | **The "Self" Node** (Root goal, e.g., "Learn Active Inference") | Center node with your topic |
| **The Policy** | **Gemini 1.5 Pro** + User Feedback | System suggests nodes; you choose which to expand |
| **The Action** | **Graph Mutation** (Pragmatic) or **Search/Query** (Epistemic) | Click to expand, prune, or generate content |
| **The Reward** | **Minimizing Variational Free Energy** (Reducing Surprise) | Uncertainty scores on nodes (dashed = uncertain) |

### The Automated Reward Model

We replace manual reward engineering with a universal objective function. The agent receives a reward $R$ calculated roughly as:

$$R(s, a) = - \text{FreeEnergy} \approx - (\underbrace{\text{Divergence from Self-Concept}}_{\text{Is this relevant?}} + \underbrace{\text{Entropy}}_{\text{Is this certain?}})$$

**How this translates to user interaction:**
* User clicks irrelevant node → High Divergence → System learns to deprioritize similar nodes
* Node has vague/contradictory information → High Entropy → Marked as "uncertain" (dashed border)
* User expands a node via search/analysis → Low Entropy → **High Positive Reward** (solid border)
* User prunes a branch → System updates priors, removes irrelevant hypotheses

**Practical uncertainty measurement:**
- No sources found → High uncertainty
- Inconsistent embeddings → High uncertainty
- Too many conflicting related nodes → High uncertainty
- User marked "not relevant" → Update belief, prune branch

---

## 🛠 Tech Stack

### Backend (`/backend/`)
* **Framework:** **FastAPI** (High-performance async Python web framework)
* **Package Manager:** **uv** (Fast Python package installer and resolver)
* **Agent Orchestration:** **LangGraph** (Building stateful, multi-actor agent workflows)
* **Language:** **Python 3.13+**
* **Brain/Policy:** **Gemini 1.5 Pro** (Context processing, search synthesis, and content generation)
* **Memory/State:** **MongoDB Atlas** (Storing the Knowledge Graph, Node Attributes, and Vector Embeddings)
* **Grounding:** **Brave Search API** (Validating nodes against real-world information to reduce uncertainty)
* **Embeddings:** Vector similarity for measuring semantic coherence and detecting contradictions

### Frontend (`/frontend/`)
* **Interactive radial graph visualization** with real-time node expansion
* **Feedback:** **MiniMax** (Auditory feedback for "System Surprise" levels - when uncertainty is high/low)

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/surreal-engine.git
cd surreal-engine

# Backend Setup
cd backend
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies using uv
uv sync

# Setup Environment Variables
cp .env.example .env
# Add keys for: GEMINI_API_KEY, BRAVE_API_KEY, MONGODB_URI, MINIMAX_API_KEY

# Frontend Setup
cd ../frontend
# (Frontend setup instructions will be added based on chosen framework)
```

### 2. Basic User Flow

**For end users (interactive mode):**
```python
from surreal.app import SurrealApp

# Launch the interactive knowledge graph
app = SurrealApp()

# User provides initial topic
app.initialize_topic("Active Inference in Neuroscience")

# System generates Layer 1 (first concepts)
# User sees radial graph with expandable nodes

# User interactions drive the RL loop:
# - Click dashed node → expands (reduces uncertainty)
# - Click solid node → view details, generate images/summaries
# - Prune → removes irrelevant branches
# - "Grow Everything" → auto-expands all uncertain nodes
```

**For developers (programmatic mode):**
```python
# All backend code lives in /backend/
from backend.core import RLEnvironment
from backend.agents import GeminiPolicy

# 1. Instantiate the Environment
env = RLEnvironment(
    self_concept="Learn Reinforcement Learning",
    initial_sources=["documents/rl_textbook.pdf", "web_search"]
)

# 2. Initialize the Agent (using LangGraph for orchestration)
agent = GeminiPolicy(model="gemini-1.5-pro")

# 3. The RL Loop (automated exploration)
state = env.reset()
done = False

while not done:
    # Agent observes the Knowledge Graph State
    action = agent.act(state)  # Returns: expand_node, search, or prune

    # Environment calculates Surprise (Reward) via Active Inference
    next_state, reward, done, info = env.step(action)

    print(f"Action: {action.name} | Reward (Surprise Reduction): {reward:.3f}")
    print(f"Uncertainty: {info['uncertainty']:.2f}")

    # Store trajectory for Post-Training
    env.save_trajectory(state, action, reward)
```

### 3. Use Cases

**Research & Learning:**
```python
# Explore a scientific topic
app.initialize_topic("Quantum Entanglement")
# System searches papers, generates concept map, highlights uncertain areas
```

**Software Engineering:**
```python
# Build a world model for a codebase
app.initialize_topic("How does this authentication system work?")
app.add_source("./src/**/*.py")
# System maps code structure, identifies dependencies, suggests improvements
```

**Content Creation:**
```python
# Develop a comprehensive understanding
app.initialize_topic("History of Jazz Music")
# Nodes can generate: summaries, images, videos, timelines
```

---

## 🎨 UX & Interaction Model

### Node Visual States
Each node has visual cues that represent its epistemic status:

| Visual State | Meaning | RL Interpretation |
| :--- | :--- | :--- |
| **Solid border** | High confidence, well-sourced | Low entropy state |
| **Dashed border** | Uncertain, needs expansion | High entropy - exploration opportunity |
| **Bold text** | User-prioritized | High reward potential |
| **Greyed out** | Pruned hypothesis | Removed from state space |

### User Actions → RL Actions

1. **Click to Expand (Epistemic Action)**
   - Triggers: Brave Search, document analysis, or LLM synthesis
   - Effect: Reduces uncertainty, creates child nodes
   - Reward: Proportional to surprise reduction

2. **View Concept Card (Observation)**
   - Shows: Summary, keywords, related concepts, uncertainty score
   - Actions available: Generate image/video, ask chatbot, prune

3. **Prune Branch (Belief Revision)**
   - Effect: Removes node from future reasoning
   - Reward: Negative (exploration cost) but improves focus
   - RL interpretation: Updating priors based on relevance feedback

4. **"Grow Everything" (Auto-Exploration)**
   - Expands all high-uncertainty nodes automatically
   - Demonstrates autonomous agent behavior
   - Useful for batch learning scenarios

### Integrated Chatbot
- References specific nodes in responses
- Helps plan exploration strategy
- Reduces uncertainty through dialogue
- Can suggest which nodes to expand next

---

## 🎯 MVP Scope (Hackathon Implementation)

**What we're building in 24 hours:**

### Core Features (Must-Have)
✅ Input topic → Generate Layer 1 nodes (search + embeddings)
✅ Click node → Expand to Layer 2 (with loading state)
✅ Uncertainty visualization (dashed vs solid borders)
✅ Basic pruning functionality
✅ Simple chatbot that references nodes
✅ Export graph as JSON/PNG

### Stretch Goals (If Time Permits)
⏱ Image/video generation from nodes (using MiniMax)
⏱ Multi-source analysis (PDFs + web + transcripts)
⏱ Real-time audio feedback for surprise levels
⏱ Collaborative multi-user exploration

### Technical Architecture (Simplified)
```
Frontend (/frontend/): React + D3.js (radial graph)
Backend (/backend/): FastAPI + LangGraph + uv (expansion logic & agent orchestration)
Agent: Gemini 1.5 Pro (search synthesis)
State: MongoDB Atlas (graph storage)
Search: Brave API (grounding)
```

**Project Structure:**
```
surreal-engine/
├── backend/          # FastAPI server, LangGraph agents, core RL logic
│   ├── app/         # FastAPI application
│   ├── agents/      # LangGraph agent definitions
│   ├── core/        # RL environment, Active Inference logic
│   └── pyproject.toml
├── frontend/         # Interactive UI
│   └── (React + D3.js components)
└── README.md
```

**The Single Core Function:**
```python
def expand(node, context):
    """Universal expansion function - drives all system behavior"""
    # 1. Calculate current uncertainty
    uncertainty = calculate_free_energy(node, context)

    # 2. If uncertain, gather information
    if uncertainty > threshold:
        search_results = brave_search(node.query)
        node.add_sources(search_results)

    # 3. Generate child nodes
    children = gemini.synthesize(node, context, search_results)

    # 4. Calculate reward (surprise reduction)
    new_uncertainty = calculate_free_energy(node, context)
    reward = uncertainty - new_uncertainty

    return children, reward
```

---

## 🔮 Post-Training Value (Winning Statement Two)

Surreal is not just a runtime tool; it is a **Data Factory for Post-Training**.

### How User Exploration Becomes Training Data

Every interaction generates a structured trajectory:

```json
{
  "state": {
    "graph_snapshot": "Current knowledge graph structure",
    "node_embeddings": "Vector representations of all concepts",
    "uncertainty_scores": "Per-node entropy measurements"
  },
  "action": {
    "type": "expand_node",
    "node_id": "concept_42",
    "user_feedback": "relevant"
  },
  "reward": {
    "surprise_reduction": 0.73,
    "entropy_before": 2.1,
    "entropy_after": 0.4
  },
  "metadata": {
    "sources_found": 5,
    "embedding_coherence": 0.89,
    "user_dwell_time": "12s"
  }
}
```

### Why This Creates Perfect Training Data

1. **Dense Reward Signals:** Every click/expansion provides a reward signal (not just task completion)
2. **Human Preferences:** User choices reveal what information is actually valuable
3. **Uncertainty Quantification:** We know exactly how uncertain the system was before each action
4. **Multi-Modal:** Graph state + text + embeddings + user behavior
5. **Scalable:** Can run in automated mode (agent-only) or interactive mode (human-in-loop)

### Post-Training Applications

**1. Fine-Tuning Smaller Models**
```python
# Use trajectories to teach a smaller model when to explore vs exploit
train_policy_model(
    state=graph_embeddings,
    action=expansion_choice,
    reward=surprise_reduction
)
```

**2. Reward Model Learning**
```python
# Learn what "good exploration" looks like from user behavior
train_reward_model(
    state_action_pairs=trajectories,
    human_feedback=user_clicks
)
```

**3. World Model Distillation**
```python
# Compress expert exploration strategies into efficient policies
distill_world_model(
    expert_trajectories=human_sessions,
    student_model=small_llm
)
```

### The Competitive Advantage

Unlike traditional RL environments:
- ✅ **No manual reward engineering** (automated via Free Energy)
- ✅ **Works across domains** (research, coding, learning, content)
- ✅ **Human-aligned by design** (users naturally provide training signal)
- ✅ **Generates dense supervision** (every action has a reward)
- ✅ **Scales to real-world complexity** (knowledge graphs can grow indefinitely)

---

## 🧬 Why Active Inference Changes Everything

Traditional RL requires you to define:
- The environment (custom gym)
- The reward function (manual engineering)
- The state space (hand-crafted features)

**Surreal automates all three:**

| Traditional RL | Surreal (Active Inference) |
| :--- | :--- |
| Build custom environment per task | Universal knowledge graph environment |
| Manually design reward functions | Automated via Free Energy minimization |
| Sparse rewards (only at task end) | Dense rewards (every interaction) |
| Requires expert labeling | Learns from natural user behavior |
| Domain-specific | Domain-agnostic |

### The Core Insight

Active Inference treats learning as **surprise minimization**:
- The system has beliefs about the world (the knowledge graph)
- Actions that reduce uncertainty (surprise) are rewarded
- User feedback naturally updates these beliefs
- The graph becomes a living, self-improving world model

This mirrors how humans actually learn: we explore what confuses us, ignore what's irrelevant, and build mental models that minimize surprise.

---

## 🚀 What Makes This a Winning Hackathon Project

**For Statement Two (RL & Post-Training):**

1. **Novel RL Paradigm:** First general-purpose RL environment based on Active Inference
2. **Automated Reward Modeling:** No manual engineering required
3. **Dense Training Data:** Every user interaction generates supervision
4. **Multi-Modal Learning:** Graph structure + embeddings + text + user behavior
5. **Production-Ready:** Works for real tasks (research, coding, learning) today

**Technical Innovation:**
- Information-theoretic reward function (mathematically principled)
- Self-anchored knowledge graphs (dynamic state representation)
- Uncertainty-guided exploration (epistemic vs pragmatic actions)
- Human-in-the-loop by design (but can run fully autonomous)

**Practical Impact:**
- Researchers can explore topics faster
- Students can build better mental models
- Developers can understand codebases quicker
- All while generating training data for future AI systems

---

## 📚 References & Theoretical Background

This system is grounded in:
- **Active Inference** (Friston, 2010): The Free Energy Principle
- **Variational Methods** (Jordan et al., 1999): Approximate Bayesian inference
- **Knowledge Graphs** (Ehrlinger & Wöß, 2016): Structured knowledge representation
- **Intrinsic Motivation in RL** (Schmidhuber, 1991): Curiosity-driven exploration

**Key Papers:**
- Friston, K. (2010). "The free-energy principle: a unified brain theory?"
- Parr, T., Pezzulo, G., & Friston, K. J. (2022). "Active Inference: The Free Energy Principle in Mind, Brain, and Behavior"
- Pathak, D., et al. (2017). "Curiosity-driven Exploration by Self-supervised Prediction"

---

## 🤝 Contributing

We welcome contributions! This is an open research project exploring the intersection of Active Inference and RL.

**Areas we need help with:**
- Frontend UX improvements
- Uncertainty quantification algorithms
- Multi-modal content generation
- Embedding optimization
- Domain-specific adaptations

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎉 Acknowledgments

Built for the AI Hackathon 2025 - Statement Two (RL & Post-Training)

Special thanks to:
- The Active Inference community
- Google Gemini team
- MongoDB Atlas
- Brave Search API

**Made with curiosity-driven exploration and minimal surprise.**


