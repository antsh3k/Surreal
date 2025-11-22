# 🧠 Surreal: The Active-Inference RL Engine

### **A Universal Environment Generator & Automated Reward Modeler**

> **Problem Statement Alignment:** Statement Two (Reinforcement Learning & Post Training)  
> **Core Innovation:** Using Active Inference to generate dense reward signals and dynamic state spaces for RL agents.

---

## 🌌 The Core Concept

Current Reinforcement Learning (RL) pipelines struggle with two major bottlenecks:
1.  **Environment Design:** Building custom "Gyms" for complex reasoning tasks (like coding, law, or logistics) is incredibly resource-intensive.
2.  **Reward Sparsity:** Agents usually only get feedback at the very end of a task (e.g., "Did the tests pass?"), making the learning process slow and inefficient.

**Surreal** is a **General-Purpose RL Engine** that solves this by treating the environment as a **Self-Anchored Knowledge Graph**. 

Instead of hard-coding arbitrary rules, Surreal uses **Active Inference**. It treats the User's Goal as a "Prior Belief" (The Self Node) and calculates the **Reward** as the mathematical reduction of "Surprise" (Free Energy) between the Agent's actions and that Prior.

### **The Hackathon Implementation**
*While Surreal is domain-agnostic, for this hackathon we have instantiated it to solve **Statement Two**, creating an RL environment specifically for Autonomous Software Engineering.*

---

## 📐 Theoretical Framework

Surreal automates the RL lifecycle by providing a universal definition of "Reward" based on Information Theory.

| Standard RL Concept | Surreal Implementation |
| :--- | :--- |
| **The Environment** | **Dynamic Knowledge Graph** (MongoDB-backed state space) |
| **The Constraint** | **The "Self" Node** (The root identity/goal, e.g., "A Secure Payment API") |
| **The Policy** | **Gemini 1.5 Pro** (Or any LLM Agent) |
| **The Action** | **Graph Mutation** (Pragmatic) or **Search/Query** (Epistemic) |
| **The Reward** | **Minimizing Variational Free Energy** (Reducing Surprise) |

### The Automated Reward Model
We replace manual reward engineering with a universal objective function. The agent receives a reward $R$ calculated roughly as:

$$R(s, a) = - \text{FreeEnergy} \approx - (\underbrace{\text{Divergence from Self-Concept}}_{\text{Is this relevant?}} + \underbrace{\text{Entropy}}_{\text{Is this certain?}})$$

* If the agent hallucinates $\rightarrow$ High Divergence $\rightarrow$ **Negative Reward**.
* If the agent is vague $\rightarrow$ High Entropy $\rightarrow$ **Low Reward**.
* If the agent gains knowledge (via Brave Search) or writes fitting code $\rightarrow$ Low Entropy $\rightarrow$ **High Positive Reward**.

---

## 🛠 Tech Stack

* **Brain/Policy:** **Gemini 1.5 Pro** (Context processing and code generation).
* **Memory/State:** **MongoDB Atlas** (Storing the Graph, Node Attributes, and Vector Embeddings).
* **Grounding:** **Brave Search API** (Validating "Fact" nodes against the real world to reduce uncertainty).
* **Feedback:** **MiniMax** (Auditory feedback for the "System Surprise" levels).

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone [https://github.com/yourusername/surreal-engine.git](https://github.com/yourusername/surreal-engine.git)
cd surreal-engine

# Install dependencies
pip install -r requirements.txt

# Setup Environment Variables
cp .env.example .env
# Add keys for: GEMINI_API_KEY, BRAVE_API_KEY, MONGODB_URI, MINIMAX_API_KEY
```

### 2. Define Your Domain (Config-Driven)
Surreal allows you to define the "Physics" of your world in a YAML file. This makes the engine reusable for coding, creative writing, or data analysis. 


Example: `configs/coding_domain.yaml`

```yaml
domain: "Software Engineering"
self_concept: "A Production-Ready Python Microservice"
constraints:
  - "Clean Architecture"
  - "PEP8 Standards"
actions:
  - name: "write_code"
    type: "pragmatic" # Attempts to satisfy the self-concept
  - name: "research_docs"
    type: "epistemic" # Attempts to reduce uncertainty
    tool: "brave_search"
```

### 3. Run the Training Loop

``` python
from surreal.core import RLEnvironment
from surreal.agents import GeminiPolicy

# 1. Instantiate the Environment from Config
env = RLEnvironment.load("configs/coding_domain.yaml")

# 2. Initialize the Agent
agent = GeminiPolicy(model="gemini-1.5-pro")

# 3. The RL Loop
state = env.reset()
done = False

while not done:
    # Agent observes the Knowledge Graph State
    action = agent.act(state)
    
    # Environment calculates Surprise (Reward) via Active Inference
    next_state, reward, done, info = env.step(action)
    
    print(f"Action: {action.name} | Reward (Surprise Drop): {reward}")
    
    # Store trajectory for Post-Training (Statement 2 Requirement)
    env.save_trajectory(state, action, reward)
```


## 🔮 Post-Training Value (Winning Statement Two)
Surreal is not just a runtime tool; it is a Data Factory for Post-Training.

By running agents in this environment, we generate structured logs containing:

1. The Graph State: A snapshot of what the agent "knew."

2. The Action: The specific query or code written.

3. The Surprise Delta: A quantifiable metric of how much that action improved the system's understanding.

This creates a perfect dataset for Fine-Tuning (Post-Training) smaller models to "think" like expert engineers without needing human-labeled data.





