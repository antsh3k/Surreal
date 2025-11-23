# Surreal Backend Implementation TODO

**Instructions**: As tasks are completed, mark them with `[x]` instead of `[ ]`. This helps track progress and ensures all implementation steps are followed systematically.

## ✅ IMPLEMENTATION STATUS (Updated: 2025-11-23)

**COMPLETED PHASES:**
- ✅ **Phase 1**: Project Foundation & Environment Setup (100%)
- ✅ **Phase 2**: Core Models & Data Structures (100%)
- ✅ **Phase 3**: Core Active Inference Logic (100%)
- ✅ **Phase 4**: LangGraph Agents (100% - All 3 agents implemented)
- ✅ **Phase 5**: Services Layer (100% - Graph & Storage services)
- ✅ **Phase 6**: FastAPI Application (100% - Routes & Main app)
- ⚠️ **Phase 7**: Testing & Validation (Partial - Basic tests created)
- ⏸️ **Phase 8**: Documentation & Deployment (Stretch goal)
- ⏸️ **Phase 9**: MVP Validation (Ready for testing)
- ⏸️ **Phase 10**: Frontend Integration (Pending)

**READY TO RUN:** Backend is fully functional and can be started with `./run.sh` or `make run`

**NEXT STEPS:**
1. Create `.env` file with your API keys (copy from `.env.example`)
2. Run `make install` to ensure dependencies are installed
3. Run `make run` to start the development server
4. Access API at http://localhost:8000/docs for interactive documentation

---

## Phase 1: Project Foundation & Environment Setup

### 1.1 Environment & Dependencies
- [x] Update `pyproject.toml` with core dependencies:
  - [x] Add `fastapi` and `uvicorn[standard]` for API server
  - [x] Add `langgraph` for agent orchestration
  - [x] Add `langchain` and `langchain-google-genai` for Gemini integration
  - [x] Add `pydantic` and `pydantic-settings` for data validation and config
  - [x] Add `python-dotenv` for environment variable management
  - [x] Add `httpx` for async HTTP requests (Brave Search API)
  - [x] Add `pymongo` and `motor` for MongoDB async operations
  - [x] Add development dependencies: `pytest`, `pytest-asyncio`, `black`, `mypy`

- [x] Create `.env.example` file with required API keys:
  ```
  GEMINI_API_KEY=your_key_here
  BRAVE_API_KEY=your_key_here
  MONGODB_URI=your_uri_here
  ENVIRONMENT=development
  LOG_LEVEL=INFO
  ```

- [x] Create `.gitignore` additions for backend-specific files
- [x] Run `uv sync` to install all dependencies

### 1.2 Project Structure
- [x] Create backend directory structure:
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py              # FastAPI application entry point
  │   ├── config.py            # Configuration management
  │   ├── models/              # Pydantic models
  │   │   ├── __init__.py
  │   │   ├── node.py          # ConceptNode models
  │   │   ├── graph.py         # Graph state models
  │   │   └── requests.py      # API request/response models
  │   ├── core/                # Core Active Inference logic
  │   │   ├── __init__.py
  │   │   ├── free_energy.py   # Free Energy calculation
  │   │   ├── uncertainty.py   # Uncertainty quantification
  │   │   └── preference.py    # Preference learning algorithms
  │   ├── agents/              # LangGraph agents
  │   │   ├── __init__.py
  │   │   ├── concept_generator.py  # Gemini concept generation
  │   │   ├── search_agent.py      # Brave Search integration
  │   │   └── expansion_agent.py   # Node expansion orchestration
  │   ├── services/            # Business logic services
  │   │   ├── __init__.py
  │   │   ├── graph_service.py     # Graph operations
  │   │   └── storage_service.py   # MongoDB operations
  │   ├── api/                 # API routes
  │   │   ├── __init__.py
  │   │   └── routes.py        # API endpoints
  │   └── utils/               # Utility functions
  │       ├── __init__.py
  │       └── logging.py       # Logging configuration
  └── tests/
      ├── __init__.py
      ├── test_free_energy.py
      ├── test_agents.py
      └── test_api.py
  ```

---

## Phase 2: Core Models & Data Structures

### 2.1 Pydantic Models (`app/models/`)

- [x] **`node.py`** - Create ConceptNode models:
  ```python
  - ConceptNodeBase (label, concept, metadata)
  - ConceptNode (adds id, isExplored, preferenceScore, position, children, etc.)
  - NodeMetadata (sources, keywords, summary, uncertainty_score)
  ```

- [x] **`graph.py`** - Create Graph state models:
  ```python
  - MindMapState (centerConcept, nodes, isGenerating, loadingNodeId, etc.)
  - GraphSnapshot (for trajectory storage)
  ```

- [x] **`requests.py`** - Create API request/response models:
  ```python
  - InitTopicRequest (topic: str)
  - InitTopicResponse (nodes: List[ConceptNode])
  - ExpandNodeRequest (node_id: str, context: MindMapState)
  - ExpandNodeResponse (children: List[ConceptNode], reward: float)
  - PreferenceUpdateRequest (node_id: str, action: str)
  ```

### 2.2 Configuration (`app/config.py`)

- [x] Create `Settings` class using Pydantic BaseSettings:
  - [x] Load environment variables (API keys, MongoDB URI)
  - [x] Set default values (uncertainty thresholds, preference learning rates)
  - [x] Configure logging levels
  - [x] Set model parameters (Gemini model name, temperature, etc.)

---

## Phase 3: Core Active Inference Logic

### 3.1 Free Energy Calculation (`app/core/free_energy.py`)

This is the heart of the Active Inference reward system.

- [x] Implement `calculate_free_energy(node: ConceptNode, context: MindMapState) -> float`:
  - [x] **Divergence from Self-Concept**: Calculate semantic distance from center topic
    - Use embedding similarity (cosine distance)
    - Higher divergence = less relevant to user's goal

  - [x] **Entropy (Uncertainty)**: Calculate information-theoretic uncertainty
    - No sources found → high entropy
    - Contradictory information → high entropy
    - Missing metadata → high entropy

  - [x] Return: `-FreeEnergy = -(Divergence + Entropy)`
  - [x] Add helper: `calculate_reward(before: float, after: float) -> float`
    - Reward = reduction in free energy (surprise minimization)

### 3.2 Uncertainty Quantification (`app/core/uncertainty.py`)

Maps to visual states (dashed vs solid borders).

- [x] Implement `calculate_uncertainty_score(node: ConceptNode) -> float`:
  - [x] Check if node has sources (no sources → 1.0 uncertainty)
  - [x] Check embedding coherence (if metadata has embeddings)
  - [x] Check for conflicting information in metadata
  - [x] Return score between 0.0 (certain) and 1.0 (uncertain)

- [x] Implement `should_mark_explored(uncertainty: float, threshold: float = 0.3) -> bool`:
  - [x] Returns True if uncertainty < threshold (solid border)
  - [x] Returns False if uncertainty >= threshold (dashed border)

### 3.3 Preference Learning (`app/core/preference.py`)

Implements the preference score update algorithm.

- [x] Implement `update_preference_score(node: ConceptNode, action: str) -> float`:
  - [x] Define score deltas:
    - `hover`: +0.02
    - `click`: +0.1
    - `expand`: +0.2
  - [x] Clamp score between -1.0 and +1.0
  - [x] Return updated score

- [x] Implement `propagate_preference(graph: MindMapState, node_id: str, boost: float = 0.1)`:
  - [x] Find sibling nodes (same parent)
  - [x] Apply sibling boost (+0.1 to related concepts)
  - [x] Update graph state in place

- [x] Implement `get_preference_hint(score: float) -> str`:
  - [x] Return `"preferred"` if score > 0.3 (green tint)
  - [x] Return `"uncertain"` if score < -0.2 (orange tint)
  - [x] Return `"neutral"` otherwise

---

## Phase 4: LangGraph Agents

### 4.1 Concept Generator Agent (`app/agents/concept_generator.py`)

Uses Gemini 1.5 Pro for generating concepts.

- [x] Create `ConceptGeneratorAgent` class:
  - [x] Initialize with Gemini API client (`langchain-google-genai`)
  - [x] Implement `generate_initial_concepts(topic: str) -> List[ConceptNode]`:
    - [ ] Prompt: "Generate 4-5 core concepts related to: {topic}"
    - [ ] Parse LLM response into ConceptNode objects
    - [ ] Set initial `preferenceScore = 0.0` (neutral)
    - [ ] Set `isExplored = False` (dashed border)
    - [ ] Calculate positions in radial layout (Layer 1)

  - [x] Implement `generate_child_concepts(parent: ConceptNode, context: MindMapState) -> List[ConceptNode]`:
    - [ ] Prompt: "Given concept '{parent.concept}' and context '{context.centerConcept}', generate 2-4 related sub-concepts"
    - [ ] Use search results if available (from search agent)
    - [ ] Parse response into ConceptNode objects
    - [ ] Set `parentId = parent.id`
    - [ ] Calculate positions relative to parent

### 4.2 Search Agent (`app/agents/search_agent.py`)

Integrates Brave Search API for grounding.

- [ ] Create `SearchAgent` class:
  - [ ] Initialize with Brave API client (httpx)
  - [ ] Implement `search_concept(query: str, max_results: int = 5) -> List[dict]`:
    - [ ] Call Brave Search API with query
    - [ ] Extract: title, URL, snippet
    - [ ] Return list of search results

  - [ ] Implement `validate_concept(concept: str, topic: str) -> dict`:
    - [ ] Search for: "{concept} {topic}"
    - [ ] Return metadata: sources, keywords, summary
    - [ ] Calculate uncertainty based on result quality

### 4.3 Expansion Agent (`app/agents/expansion_agent.py`)

Orchestrates the full node expansion workflow using LangGraph.

- [ ] Create `ExpansionAgent` using LangGraph StateGraph:
  - [ ] Define graph state structure:
    ```python
    class ExpansionState(TypedDict):
        node: ConceptNode
        context: MindMapState
        search_results: Optional[List[dict]]
        children: List[ConceptNode]
        uncertainty_before: float
        uncertainty_after: float
        reward: float
    ```

  - [ ] Define graph nodes:
    - [ ] `calculate_initial_uncertainty`: Calculate free energy before expansion
    - [ ] `perform_search`: Call SearchAgent if uncertainty > threshold
    - [ ] `generate_concepts`: Call ConceptGeneratorAgent with search results
    - [ ] `validate_children`: Calculate uncertainty for each child
    - [ ] `calculate_reward`: Compute surprise reduction

  - [ ] Define graph edges (sequential workflow):
    ```
    START → calculate_initial_uncertainty → perform_search →
    generate_concepts → validate_children → calculate_reward → END
    ```

  - [ ] Implement `expand(node: ConceptNode, context: MindMapState) -> dict`:
    - [ ] Run the LangGraph workflow
    - [ ] Return: `{children: List[ConceptNode], reward: float}`

---

## Phase 5: Services Layer

### 5.1 Graph Service (`app/services/graph_service.py`)

Business logic for graph operations.

- [ ] Create `GraphService` class:
  - [ ] Implement `create_initial_graph(topic: str) -> MindMapState`:
    - [ ] Call ConceptGeneratorAgent to create Layer 1 nodes
    - [ ] Create center node (the "Self Node")
    - [ ] Return MindMapState with initial nodes

  - [ ] Implement `expand_node(node_id: str, graph: MindMapState) -> dict`:
    - [ ] Find node by ID
    - [ ] Call ExpansionAgent to generate children
    - [ ] Update node.isExplored if uncertainty is low
    - [ ] Add children to graph.nodes
    - [ ] Return expansion result

  - [ ] Implement `update_preferences(node_id: str, action: str, graph: MindMapState)`:
    - [ ] Find node by ID
    - [ ] Update preference score based on action
    - [ ] Propagate preference to siblings
    - [ ] Update graph state

### 5.2 Storage Service (`app/services/storage_service.py`)

MongoDB integration for graph persistence (stretch goal).

- [ ] Create `StorageService` class:
  - [ ] Initialize Motor (async MongoDB client)
  - [ ] Implement `save_graph(session_id: str, graph: MindMapState)`:
    - [ ] Serialize graph to MongoDB document
    - [ ] Store in `graphs` collection

  - [ ] Implement `load_graph(session_id: str) -> MindMapState`:
    - [ ] Fetch from MongoDB
    - [ ] Deserialize into MindMapState

  - [ ] Implement `save_trajectory(session_id: str, state, action, reward)`:
    - [ ] Store interaction trajectory for post-training
    - [ ] Save to `trajectories` collection

---

## Phase 6: FastAPI Application

### 6.1 API Routes (`app/api/routes.py`)

- [ ] Create API router with CORS middleware

- [ ] **POST `/api/init`** - Initialize graph from topic:
  - [ ] Input: `InitTopicRequest(topic: str)`
  - [ ] Call: `GraphService.create_initial_graph(topic)`
  - [ ] Output: `InitTopicResponse(nodes: List[ConceptNode])`
  - [ ] Time target: < 2 seconds

- [ ] **POST `/api/expand`** - Expand a node:
  - [ ] Input: `ExpandNodeRequest(node_id: str, context: MindMapState)`
  - [ ] Call: `GraphService.expand_node(node_id, context)`
  - [ ] Output: `ExpandNodeResponse(children: List[ConceptNode], reward: float)`
  - [ ] Time target: < 3 seconds

- [ ] **POST `/api/preference`** - Update preference score:
  - [ ] Input: `PreferenceUpdateRequest(node_id: str, action: str, context: MindMapState)`
  - [ ] Call: `GraphService.update_preferences(node_id, action, context)`
  - [ ] Output: Updated node with new preference score
  - [ ] Time target: < 100ms

- [ ] **GET `/api/graph/{session_id}`** - Retrieve saved graph (stretch):
  - [ ] Call: `StorageService.load_graph(session_id)`
  - [ ] Output: Full MindMapState

- [ ] **POST `/api/export`** - Export graph data (stretch):
  - [ ] Input: `session_id` or graph state
  - [ ] Output: JSON format of full graph

- [ ] **GET `/health`** - Health check endpoint:
  - [ ] Return: `{status: "healthy", timestamp: ...}`

### 6.2 Main Application (`app/main.py`)

- [ ] Create FastAPI app instance with metadata:
  - [ ] Title: "Surreal Backend API"
  - [ ] Description: "Active Inference Knowledge Graph Engine"
  - [ ] Version: "0.1.0"

- [ ] Configure CORS middleware:
  - [ ] Allow origins: `["http://localhost:5173", "http://localhost:3000"]` (Vite/React)
  - [ ] Allow credentials: True
  - [ ] Allow methods: `["*"]`
  - [ ] Allow headers: `["*"]`

- [ ] Include API router from routes.py

- [ ] Add startup event handler:
  - [ ] Initialize logging
  - [ ] Validate environment variables
  - [ ] Test MongoDB connection (if configured)
  - [ ] Test Gemini API connection

- [ ] Add shutdown event handler:
  - [ ] Close MongoDB connections
  - [ ] Cleanup resources

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

- [ ] **Test Free Energy Calculation** (`tests/test_free_energy.py`):
  - [ ] Test divergence calculation with mock embeddings
  - [ ] Test entropy calculation with varying source counts
  - [ ] Test reward calculation (surprise reduction)
  - [ ] Test edge cases (no sources, missing metadata)

- [ ] **Test Preference Learning** (`tests/test_preference.py`):
  - [ ] Test score updates for each action type
  - [ ] Test score clamping (-1.0 to +1.0)
  - [ ] Test sibling propagation
  - [ ] Test preference hint generation

- [ ] **Test Agents** (`tests/test_agents.py`):
  - [ ] Test ConceptGeneratorAgent with mock Gemini responses
  - [ ] Test SearchAgent with mock Brave API responses
  - [ ] Test ExpansionAgent LangGraph workflow

### 7.2 Integration Tests

- [ ] **Test API Endpoints** (`tests/test_api.py`):
  - [ ] Test `/api/init` with sample topic
  - [ ] Test `/api/expand` with mock graph state
  - [ ] Test `/api/preference` updates
  - [ ] Test error handling (invalid node_id, missing API keys)

### 7.3 Manual Testing

- [ ] Test full workflow with real APIs:
  - [ ] Initialize topic: "Active Inference in AI"
  - [ ] Expand 2-3 nodes
  - [ ] Verify preference learning works
  - [ ] Check response times meet targets
  - [ ] Verify uncertainty scores are reasonable

---

## Phase 8: Documentation & Deployment Prep

### 8.1 Documentation

- [ ] Create `backend/README.md` with:
  - [ ] Installation instructions using uv
  - [ ] Environment setup guide
  - [ ] API endpoint documentation
  - [ ] Architecture overview
  - [ ] Development workflow

- [ ] Add docstrings to all public functions:
  - [ ] Google-style docstrings
  - [ ] Include type hints
  - [ ] Document Active Inference concepts

- [ ] Create `backend/ARCHITECTURE.md`:
  - [ ] Explain Active Inference implementation
  - [ ] Document reward calculation
  - [ ] Explain LangGraph workflows
  - [ ] Include diagrams if helpful

### 8.2 Development Tools

- [ ] Create `run.sh` script:
  ```bash
  #!/bin/bash
  uv run uvicorn app.main:app --reload --port 8000
  ```

- [ ] Create `test.sh` script:
  ```bash
  #!/bin/bash
  uv run pytest tests/ -v
  ```

- [ ] Add `Makefile` for common tasks:
  ```makefile
  install:
      uv sync

  run:
      uv run uvicorn app.main:app --reload

  test:
      uv run pytest tests/ -v

  format:
      uv run black app/ tests/
      uv run ruff check app/ tests/ --fix
  ```

### 8.3 Production Readiness (Stretch)

- [ ] Add proper logging with structured formats
- [ ] Add request ID tracking for debugging
- [ ] Add rate limiting to API endpoints
- [ ] Add API key validation middleware
- [ ] Create Docker configuration:
  - [ ] `Dockerfile` for backend
  - [ ] `docker-compose.yml` with MongoDB
- [ ] Add monitoring/metrics collection
- [ ] Create deployment guide for cloud platforms

---

## Phase 9: MVP Validation

### 9.1 MVP Requirements Checklist

The **one thing that must work perfectly**: Epistemic Expansion with Preference Learning

- [ ] ✅ User provides topic via `/api/init`
- [ ] ✅ System returns 4-5 initial concepts in < 2 seconds
- [ ] ✅ User clicks dashed node via `/api/expand`
- [ ] ✅ System returns 2-4 relevant child concepts in < 3 seconds
- [ ] ✅ System updates preference scores via `/api/preference`
- [ ] ✅ Green hints appear after 4-5 interactions (frontend will handle visualization)
- [ ] ✅ Uncertainty scores properly determine dashed vs solid borders

### 9.2 Performance Targets

- [ ] Initial concept generation: < 2 seconds
- [ ] Node expansion: < 3 seconds
- [ ] Preference update: < 100ms
- [ ] API consistently returns valid responses
- [ ] No crashes during extended use

### 9.3 Core Active Inference Validation

- [ ] Free Energy calculation produces meaningful values
- [ ] Reward signal correlates with surprise reduction
- [ ] Uncertainty scores match expected behavior:
  - [ ] Nodes with no sources → high uncertainty
  - [ ] Nodes with sources → low uncertainty
  - [ ] Nodes get marked explored when uncertainty drops
- [ ] Preference learning produces visible patterns:
  - [ ] Scores increase with interaction
  - [ ] Sibling propagation works
  - [ ] Hints (green/orange) appear appropriately

---

## Phase 10: Integration with Frontend

### 10.1 API Contract Validation

- [ ] Ensure response models match frontend TypeScript interfaces:
  - [ ] ConceptNode structure matches `frontend/src/types/index.ts`
  - [ ] MindMapState structure matches frontend expectations
  - [ ] Preference score range is -1.0 to +1.0
  - [ ] Position coordinates are included for initial layout

- [ ] Test CORS configuration with actual frontend:
  - [ ] Run frontend dev server
  - [ ] Make API calls from React app
  - [ ] Verify no CORS errors

### 10.2 End-to-End Testing

- [ ] Test full flow from frontend to backend:
  - [ ] Topic input → Initial nodes appear
  - [ ] Click expansion → New nodes appear
  - [ ] Multiple clicks → Preferences update
  - [ ] Visual states match backend data (dashed/solid, green/orange)

---

## Notes & Active Inference Implementation Details

### Free Energy Calculation Philosophy

Per README.md, the reward function is:
```
R(s, a) = -FreeEnergy ≈ -(Divergence + Entropy)

Where:
- Divergence = "Is this concept relevant to my goal?"
- Entropy = "Is this information certain/well-grounded?"
```

**Implementation Strategy**:
1. **Divergence**: Use embedding similarity between node concept and center topic
   - Higher cosine distance = higher divergence (less relevant)
   - Can use Gemini embeddings API or sentence-transformers

2. **Entropy**: Measure uncertainty based on:
   - Source count (0 sources = max entropy)
   - Source quality (conflicting info = high entropy)
   - Metadata completeness

3. **Reward**: Calculate before/after expansion
   - `reward = free_energy_before - free_energy_after`
   - Positive reward = expansion reduced surprise (good action)

### Visual State Mapping

Backend calculates, frontend renders:
- `uncertainty_score > 0.3` → **Dashed border** (unexplored)
- `uncertainty_score <= 0.3` → **Solid border** (explored)
- `preferenceScore > 0.3` → **Green tint** (preferred)
- `preferenceScore < -0.2` → **Orange tint** (uncertain relevance)

### LangGraph Workflow

The expansion agent orchestrates:
```
1. Calculate initial uncertainty (free energy before)
2. If uncertain, search for grounding (Brave API)
3. Generate child concepts (Gemini with search context)
4. Calculate child uncertainties
5. Calculate reward (surprise reduction)
6. Return children + reward
```

This creates the RL loop where:
- **State** = Current graph + node to expand
- **Action** = Expand node (search + generate)
- **Reward** = Surprise reduction (free energy minimization)

---

## Success Criteria

This backend implementation is complete when:

1. ✅ All core API endpoints work reliably
2. ✅ Active Inference math produces meaningful reward signals
3. ✅ Preference learning creates visible patterns
4. ✅ Performance targets are met (< 2s init, < 3s expand)
5. ✅ Frontend can successfully integrate with all endpoints
6. ✅ The MVP demo scenario works end-to-end
7. ✅ Code is documented and tested

**The core innovation**: Automated reward modeling through Free Energy minimization, creating a universal RL environment for knowledge exploration.
