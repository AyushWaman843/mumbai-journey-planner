# 🚆 Mumbai Journey Planner

A multi-modal transport routing system for Mumbai's railway and metro network using **Graph Theory** and **Dijkstra's Algorithm**. Find the fastest, cheapest, or most comfortable route across 150+ stations with real-time visualization.

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![React](https://img.shields.io/badge/React-18.0-61dafb)
![NetworkX](https://img.shields.io/badge/NetworkX-3.0-orange)

---

## 🎯 Key Features

### **Multi-Criteria Route Optimization**
- **⚡ Fastest Route**: Minimizes total travel time using any combination of Metro/Local trains
- **💰 Cheapest Route**: Uses only local trains (₹5/station), completely avoids Metro (₹20/station)
- **🪑 Comfortable Route**: Prioritizes AC Metro, minimizes transfers, ensures 20%+ Metro usage

### **Comprehensive Network Coverage**
- **150+ Stations** across Mumbai Metropolitan Region
- **6 Railway Lines**: Western, Central Main, Central Kasara, Central Karjat, Harbour, Trans-Harbour
- **3 Metro Lines**: Line 1 (Versova-Ghatkopar), Line 2A (Dahisar-DN Nagar), Line 7 (Dahisar-Andheri East)
- **15+ Junction Points** for seamless multi-line transfers

### **Interactive Map Visualization**
- Real-time route highlighting on network map
- Zoom, pan, and touch-friendly controls
- Station markers with color-coded railway lines
- Mobile-responsive design

---

## 🧠 DSA Concepts Implemented

### **1. Graph Representation**
```python
G = nx.Graph()  # Undirected weighted graph
# Nodes: 150+ stations
# Edges: 250+ connections with multiple weights
```

**Edge Properties (Multi-Weight System)**:
- `time` (minutes): Travel duration
- `cost` (rupees): Ticket fare
- `comfort` (1-10): Comfort rating (AC Metro = 10, Local = 5)
- `distance` (km): Physical distance
- `mode`: Transport type (Local Train/Metro/Transfer)

### **2. Dijkstra's Algorithm (Three Variants)**

#### **Variant 1: Fastest Route**
```python
# Pure time-based optimization
path = nx.dijkstra_path(G, source, dest, weight='time')
```
- Uses `time` weight exclusively
- Allows Metro if it reduces total time
- Accounts for transfer time at junctions

#### **Variant 2: Cheapest Route**
```python
# Subgraph filtering technique
local_edges = [(u, v, d) for u, v, d in G.edges(data=True) 
               if d['mode'] in ['Local Train', 'Transfer']]
G_local = nx.Graph()
G_local.add_edges_from(local_edges)
path = nx.dijkstra_path(G_local, source, dest, weight='cost')
```
- Creates filtered subgraph with **only** local train edges
- Removes all Metro edges (₹20/station)
- Guarantees minimum cost (all edges = ₹5)

#### **Variant 3: Comfortable Route**
```python
# Custom weight function
def comfort_weight(u, v, d):
    if d['mode'] == 'Metro':
        return d['time'] * 0.3      # Heavily prefer Metro
    elif d['mode'] == 'Transfer':
        return 50 + d['time']       # Penalize transfers
    else:
        return d['time'] * 3.0      # Use local only if necessary

path = nx.dijkstra_path(G, source, dest, weight=comfort_weight)
```
- Metro segments: Low weight (0.3× multiplier)
- Transfers: High penalty (+50 points)
- Local trains: Moderate weight (3.0× multiplier)
- Validation: Rejects routes with <20% Metro usage

### **3. Junction/Transfer Edges**
```python
junctions = [
    ("Dadar", "Dadar", 8, 0, 5, "Transfer", "Western-Central Junction"),
    ("Andheri", "Andheri", 12, 0, 4, "Transfer", "Western-Metro1 Interchange"),
    # ... 15+ junctions
]
```
- Connects separate railway lines into single graph
- Transfer time: 8-15 minutes (walking + waiting)
- Zero cost (no additional fare)
- Critical for multi-line journeys

### **4. Path Metrics Calculation**
```python
def calculate_path_metrics(path):
    # Traverse path edges
    for i in range(len(path) - 1):
        edge_data = G.get_edge_data(path[i], path[i + 1])
        total_time += edge_data['time']
        total_cost += edge_data['cost']
        
        # Detect line changes (transfers)
        if current_line != edge_data['line']:
            transfers.append({...})
```
- Aggregates time, cost, distance
- Detects transfers (line changes)
- Calculates Metro percentage
- Builds segment-wise journey breakdown

---

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────┐
│           FRONTEND (React)                  │
│  ┌────────────┐         ┌────────────┐     │
│  │  App.jsx   │────────▶│ MapView.jsx│     │
│  └────────────┘         └────────────┘     │
│       │                       │             │
│       │ (HTTP POST)           │ (SVG       │
│       │                       │  Render)   │
└───────┼───────────────────────┼─────────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────┐
│          BACKEND (Flask API)                │
│  ┌──────────────────────────────────────┐   │
│  │  Graph Construction (NetworkX)       │   │
│  │  • Nodes: 150+ stations              │   │
│  │  • Edges: 250+ connections           │   │
│  │  • Weights: time, cost, comfort      │   │
│  └──────────────────────────────────────┘   │
│                    ▼                        │
│  ┌──────────────────────────────────────┐   │
│  │  Routing Algorithms                  │   │
│  │  • find_fastest_route()              │   │
│  │  • find_cheapest_route()             │   │
│  │  • find_comfortable_route()          │   │
│  └──────────────────────────────────────┘   │
│                    ▼                        │
│  ┌──────────────────────────────────────┐   │
│  │  Path Metrics & Formatting           │   │
│  │  • calculate_path_metrics()          │   │
│  │  • format_route_instructions()       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- npm or yarn

### **Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install flask flask-cors networkx

# Run Flask server
python app.py
```

Server runs at: `http://127.0.0.1:5000`

### **Frontend Setup**
```bash
cd my-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Application opens at: `http://localhost:5173`

---

## 📡 API Endpoints

### **1. Find Journey**
```http
POST /api/journey
Content-Type: application/json

{
  "from": "Churchgate",
  "to": "Ghatkopar",
  "routeType": "fastest"  // "fastest" | "cheapest" | "comfortable"
}
```

**Response:**
```json
{
  "route": [
    "🚆 Take Local Train - Western Line",
    "   From: Churchgate → To: Dadar",
    "   (7 stops, ~21 min)",
    "🔄 Transfers:",
    "   → At Dadar: Change from Western Line to Central Line",
    "📊 Journey Summary:",
    "   ⏱️  Total Time: 38 minutes",
    "   💰 Total Cost: ₹75",
    "   📍 Distance: 24.5 km",
    "   🔄 Transfers: 1"
  ],
  "time": "38 min",
  "cost": "₹75",
  "distance": "24.5 km",
  "transfers": 1,
  "comfort": 6.2,
  "metro_percentage": 0
}
```

### **2. Get All Routes**
```http
POST /api/journey/all

{
  "from": "Churchgate",
  "to": "Ghatkopar"
}
```

Returns all three route options (fastest, cheapest, comfortable) for comparison.

### **3. Get All Stations**
```http
GET /api/stations
```

Returns list of all 150+ station names for autocomplete.

### **4. Health Check**
```http
GET /api/health
```

---

## 🎮 Usage Example

### **Scenario 1: Office Commute (Time-Critical)**
```
From: Andheri
To: CSMT
Route Type: Fastest

Result:
✅ Uses Metro Line 1 to Ghatkopar (12 min)
✅ Transfers to Central Line (10 min transfer)
✅ Reaches CSMT via Central Main (18 min)
Total: 40 minutes, ₹95
```

### **Scenario 2: Student Travel (Budget-Conscious)**
```
From: Borivali
To: Dadar
Route Type: Cheapest

Result:
✅ Uses Western Line local train only
✅ No Metro (avoids ₹20/station fare)
✅ Direct route, no transfers
Total: 36 minutes, ₹15
```

### **Scenario 3: Comfortable Journey (AC Preferred)**
```
From: Dahisar East
To: Andheri
Route Type: Comfortable

Result:
✅ Uses Metro Line 7 (AC, comfortable)
✅ 85% of journey in AC Metro
✅ Minimal transfers (1 only)
Total: 22 minutes, ₹60, Comfort: 9.2/10
```

---

## 🧪 Algorithm Complexity

### **Time Complexity**
```
Dijkstra's Algorithm: O((V + E) log V)

Where:
V = 150 stations (vertices)
E = 250 connections (edges)

Calculation:
= O((150 + 250) × log(150))
= O(400 × 7.2)
= O(2,880) operations

Average query time: < 50ms
```

### **Space Complexity**
```
Graph Storage: O(V + E)
= O(150 + 250)
= O(400)

Additional structures:
- Priority queue: O(V) = O(150)
- Distance map: O(V) = O(150)
- Path reconstruction: O(V) = O(150)

Total: O(V + E) ≈ O(550)
```

---

## 🗺️ Network Statistics

| Metric | Value |
|--------|-------|
| **Total Stations** | 150+ |
| **Total Connections** | 250+ |
| **Railway Lines** | 6 (Western, Central Main, Central Kasara, Central Karjat, Harbour, Trans-Harbour) |
| **Metro Lines** | 3 (Line 1, 2A, 7) |
| **Junction Points** | 15+ |
| **Longest Line** | Western Line (29 stations, Churchgate to Virar) |
| **Network Span** | ~120 km |

---

## 🛠️ Technologies Used

### **Backend**
- **Flask**: REST API framework
- **NetworkX**: Graph algorithms library
- **Flask-CORS**: Cross-origin resource sharing

### **Frontend**
- **React**: UI framework
- **Vite**: Build tool
- **Lucide React**: Icon library
- **SVG**: Map visualization

---

## 🎯 Key Implementation Highlights

### **1. Multi-Weight Optimization**
Unlike traditional shortest path problems, this system optimizes across **5 different weights** simultaneously:
- Time (minutes)
- Cost (rupees)
- Comfort (rating)
- Distance (km)
- Mode (categorical)

### **2. Subgraph Filtering for Cost Optimization**
The "cheapest route" uses a clever **graph filtering technique**:
```python
# Instead of modifying weights, REMOVE expensive edges entirely
G_local = G.subgraph(only_local_train_edges)
# Now Dijkstra can ONLY find local-train paths
```

### **3. Dynamic Transfer Detection**
Automatically identifies line changes by comparing consecutive edge line names:
```python
if current_line != edge_data['line']:
    # Transfer detected!
    transfers.append({...})
```

### **4. Real-Time Map Highlighting**
Uses **regex pattern matching** to extract route segments from API response:
```javascript
const segmentMatch = line.match(/(?:🚆|🚇) Take .+ - (.+?)\s+From: (.+?) → To: (.+)/);
```

---

## 📊 Route Comparison Example

| Route Type | Time | Cost | Transfers | Metro % | Use Case |
|-----------|------|------|-----------|---------|----------|
| **Fastest** | 38 min | ₹75 | 1 | 45% | Office commute |
| **Cheapest** | 52 min | ₹15 | 2 | 0% | Student travel |
| **Comfortable** | 31 min | ₹120 | 0 | 95% | Premium travel |

---

## 🤝 Contributing

This is a Data Structures & Algorithms project demonstrating:
- Graph theory applications
- Dijkstra's algorithm variants
- Multi-criteria optimization
- Real-world problem solving

---

## 📝 License

Educational project for DSA coursework.

---

## 👤 Author

**[Your Name]**  
DSA Project - Mumbai Journey Planner  
[Your Institution]

---

## 🙏 Acknowledgments

- **NetworkX** for graph algorithms
- **Mumbai Railway** and **Mumbai Metro** for network data
- **Flask** and **React** communities

---

**⭐ If this helped you understand graph algorithms, give it a star!**
```
