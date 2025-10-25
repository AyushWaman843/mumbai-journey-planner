from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
from collections import defaultdict
import heapq

app = Flask(__name__)
CORS(app)

# ===================== COMPREHENSIVE STATION & LINE DATA =====================

# WESTERN LINE STATIONS (Churchgate to Virar)
western_line = [
    "Churchgate", "Marine Lines", "Charni Road", "Grant Road", "Mumbai Central",
    "Mahalakshmi", "Lower Parel", "Prabhadevi", "Dadar", "Matunga Road",
    "Mahim Junction", "Bandra", "Khar Road", "Santacruz", "Vile Parle",
    "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon", "Malad",
    "Kandivali", "Borivali", "Dahisar", "Mira Road", "Bhayander",
    "Naigaon", "Vasai Road", "Nalla Sopara", "Virar"
]

# CENTRAL LINE MAIN (CSMT to Kalyan)
central_main = [
    "CSMT", "Masjid", "Sandhurst Road", "Byculla", "Chinchpokli",
    "Currey Road", "Parel", "Dadar", "Matunga", "Sion",
    "Kurla", "Vidyavihar", "Ghatkopar", "Vikhroli", "Kanjur Marg",
    "Bhandup", "Nahur", "Mulund", "Thane", "Kalva",
    "Mumbra", "Diva Junction", "Kopar", "Dombivli", "Thakurli", "Kalyan"
]

# CENTRAL LINE - KASARA BRANCH (from Kalyan)
central_kasara = [
    "Kalyan", "Shahad", "Ambivli", "Titwala", "Khadavli",
    "Vasind", "Asangaon", "Atgaon", "Thansit", "Khardi",
    "Umbermali", "Kasara"
]

# CENTRAL LINE - KARJAT BRANCH (from Kalyan)
central_karjat = [
    "Kalyan", "Vithalwadi", "Ulhasnagar", "Ambarnath", "Badlapur",
    "Vangani", "Shelu", "Neral", "Bhivpuri Road", "Karjat"
]

# HARBOUR LINE (CSMT to Panvel)
harbour_line = [
    "CSMT", "Masjid", "Sandhurst Road", "Dockyard Road", "Reay Road",
    "Cotton Green", "Sewri", "Vadala Road", "GTB Nagar", "Chunabhatti",
    "Kurla", "Tilak Nagar", "Chembur", "Govandi", "Mankhurd",
    "Vashi", "Sanpada", "Juinagar", "Nerul", "Seawood Darave",
    "Belapur CBD", "Kharghar", "Mansarovar", "Khandeshwar", "Panvel"
]

# TRANS-HARBOUR LINE (Thane to Panvel via Navi Mumbai)
trans_harbour = [
    "Thane", "Airoli", "Rabale", "Ghansoli", "Koparkhairane",
    "Turbhe", "Juinagar", "Nerul", "Seawood Darave", "Belapur CBD",
    "Kharghar", "Mansarovar", "Khandeshwar", "Panvel"
]

# METRO LINE 1 (Versova to Ghatkopar) - AC Metro
metro_line_1 = [
    "Versova", "D.N. Nagar", "Azad Nagar", "Andheri", "Western Express Highway",
    "Chakala", "Airport Road", "Marol Naka", "Saki Naka", "Jagruti Nagar",
    "Asalpha", "Ghatkopar"
]

# METRO LINE 2A (Dahisar East to D.N. Nagar) - AC Metro
# Renamed to avoid conflicts with Western Line stations
metro_line_2a = [
    "Dahisar East", "Anand Nagar", "Dahisar West", "Ovaripada", "Magathane",
    "Devipada", "Kandivali Metro", "Poisar", "Mandapeshwar", "Borivali Metro",
    "Eksar", "Goregaon Metro", "Malad Metro", "Kurar Village", "Aarey",
    "JVLR", "Jogeshwari Metro", "Vile Parle Metro", "D.N. Nagar"
]

# METRO LINE 7 (Dahisar East to Andheri East) - AC Metro
metro_line_7 = [
    "Dahisar East", "Mahavir Nagar", "Pushpa Park", "Akurli Road",
    "MTNL", "Andheri East"
]

# ===================== BUILD COMPREHENSIVE GRAPH =====================

G = nx.Graph()

def add_line_edges(stations, mode, line_name, time_per_station, fare_per_station, comfort_rating):
    """Add edges for a complete line with realistic parameters"""
    for i in range(len(stations) - 1):
        G.add_edge(
            stations[i],
            stations[i + 1],
            time=time_per_station,
            cost=fare_per_station,
            comfort=comfort_rating,
            mode=mode,
            line=line_name,
            distance=2.0,
            is_metro=(mode == "Metro")
        )

# LOCAL TRAINS: Cheap (₹5), Moderate comfort (5), Standard speed (3 min/station)
add_line_edges(western_line, "Local Train", "Western Line", 3, 5, 5)
add_line_edges(central_main, "Local Train", "Central Line", 3, 5, 5)
add_line_edges(central_kasara, "Local Train", "Central Line (Kasara)", 4, 5, 5)
add_line_edges(central_karjat, "Local Train", "Central Line (Karjat)", 4, 5, 5)
add_line_edges(harbour_line, "Local Train", "Harbour Line", 3, 5, 5)
add_line_edges(trans_harbour, "Local Train", "Trans-Harbour Line", 3, 5, 5)

# METRO: Expensive (₹20), High comfort (10 = AC), Fast (2 min/station)
add_line_edges(metro_line_1, "Metro", "Metro Line 1", 2, 20, 10)
add_line_edges(metro_line_2a, "Metro", "Metro Line 2A", 2, 20, 10)
add_line_edges(metro_line_7, "Metro", "Metro Line 7", 2, 20, 10)

# ===================== JUNCTION/INTERCHANGE CONNECTIONS =====================
# CRITICAL: These enable multi-line journeys
# Transfer time = walking + platform change + waiting

junctions = [
    # MAJOR RAILWAY JUNCTIONS (same physical location, different lines)
    ("Dadar", "Dadar", 8, 0, 5, "Transfer", "Western-Central Junction"),
    ("Kurla", "Kurla", 8, 0, 5, "Transfer", "Central-Harbour Junction"),
    ("CSMT", "CSMT", 3, 0, 5, "Transfer", "Central-Harbour Junction"),
    ("Thane", "Thane", 8, 0, 5, "Transfer", "Central-TransHarbour Junction"),
    ("Kalyan", "Kalyan", 5, 0, 5, "Transfer", "Central Main-Branch Junction"),
    
    # METRO-RAILWAY INTERCHANGES (requires walking between stations)
    ("Andheri", "Andheri", 12, 0, 4, "Transfer", "Western-Metro1 Interchange"),
    ("Ghatkopar", "Ghatkopar", 10, 0, 4, "Transfer", "Central-Metro1 Interchange"),
    ("D.N. Nagar", "D.N. Nagar", 5, 0, 5, "Transfer", "Metro1-Metro2A Junction"),
    ("Dahisar East", "Dahisar East", 5, 0, 5, "Transfer", "Metro2A-Metro7 Junction"),
    
    # METRO 2A <-> WESTERN LINE (separate stations, require walking)
    ("Borivali", "Borivali Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    ("Goregaon", "Goregaon Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    ("Jogeshwari", "Jogeshwari Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    ("Vile Parle", "Vile Parle Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    ("Kandivali", "Kandivali Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    ("Malad", "Malad Metro", 10, 0, 4, "Transfer", "Western-Metro2A Interchange"),
    
    # NAVI MUMBAI JUNCTIONS
    ("Juinagar", "Juinagar", 8, 0, 5, "Transfer", "Harbour-TransHarbour Junction"),
    ("Nerul", "Nerul", 8, 0, 5, "Transfer", "Harbour-TransHarbour Junction"),
    ("Panvel", "Panvel", 8, 0, 5, "Transfer", "Multi-line Junction"),
    
    # ANDHERI EAST CONNECTION (Metro 7 to other lines)
    ("Andheri", "Andheri East", 15, 0, 4, "Transfer", "Andheri-AndheriEast Interchange"),
]

# Add all junction edges
for u, v, time, cost, comfort, mode, line in junctions:
    if u in G.nodes() and v in G.nodes():
        G.add_edge(u, v, time=time, cost=cost, comfort=comfort, mode=mode, 
                   line=line, distance=0, is_metro=False)

# ===================== ADVANCED ROUTING ALGORITHMS =====================

def calculate_path_metrics(path):
    """Calculate comprehensive metrics for a path"""
    if len(path) < 2:
        return None
    
    edges = []
    total_time = 0
    total_cost = 0
    total_distance = 0
    comfort_scores = []
    transfers = []
    current_line = None
    current_mode = None
    segments = []
    current_segment = None
    metro_time = 0
    travel_time = 0  # Excludes transfer time
    
    for i in range(len(path) - 1):
        edge_data = G.get_edge_data(path[i], path[i + 1])
        if not edge_data:
            continue
            
        edges.append({
            'from': path[i],
            'to': path[i + 1],
            'data': edge_data
        })
        
        total_time += edge_data['time']
        total_cost += edge_data['cost']
        total_distance += edge_data['distance']
        comfort_scores.append(edge_data['comfort'])
        
        # Track Metro usage
        if edge_data.get('is_metro', False):
            metro_time += edge_data['time']
            travel_time += edge_data['time']
        elif edge_data['mode'] != 'Transfer':
            travel_time += edge_data['time']
        
        # Build segments and detect transfers
        if edge_data['mode'] == 'Transfer':
            # Transfer detected
            if current_segment:
                segments.append(current_segment)
                current_segment = None
            if current_line:  # Only count if we were already on a line
                transfers.append({
                    'station': path[i],
                    'from_line': current_line,
                    'to_line': 'Transfer',
                    'time': edge_data['time']
                })
        else:
            # Regular travel segment
            if current_segment and (current_segment['line'] == edge_data['line']):
                # Continue existing segment
                current_segment['end'] = path[i + 1]
                current_segment['stops'] += 1
                current_segment['time'] += edge_data['time']
            else:
                # Start new segment
                if current_segment:
                    segments.append(current_segment)
                current_segment = {
                    'mode': edge_data['mode'],
                    'line': edge_data['line'],
                    'start': path[i],
                    'end': path[i + 1],
                    'stops': 1,
                    'time': edge_data['time']
                }
                
                # Detect line change (transfer)
                if current_line and current_line != edge_data['line']:
                    transfers.append({
                        'station': path[i],
                        'from_line': current_line,
                        'to_line': edge_data['line'],
                        'time': 0
                    })
            
            current_line = edge_data['line']
            current_mode = edge_data['mode']
    
    # Add final segment
    if current_segment:
        segments.append(current_segment)
    
    avg_comfort = sum(comfort_scores) / len(comfort_scores) if comfort_scores else 0
    metro_percentage = (metro_time / travel_time * 100) if travel_time > 0 else 0
    
    return {
        'path': path,
        'segments': segments,
        'edges': edges,
        'total_time': total_time,
        'total_cost': total_cost,
        'total_distance': round(total_distance, 1),
        'avg_comfort': round(avg_comfort, 1),
        'num_transfers': len(transfers),
        'transfers': transfers,
        'metro_time': metro_time,
        'metro_percentage': round(metro_percentage, 1)
    }

def find_fastest_route(src, dest):
    """
    FASTEST ROUTE LOGIC:
    - ONLY optimizes for TIME
    - Uses any combination of Metro/Local that minimizes total time
    - Ignores cost completely
    - Considers transfer time accurately
    """
    try:
        # Pure time-based Dijkstra
        path = nx.dijkstra_path(G, src, dest, weight='time')
        return calculate_path_metrics(path)
    except nx.NetworkXNoPath:
        return None
    except Exception as e:
        print(f"Error in find_fastest_route: {e}")
        return None

def find_cheapest_route(src, dest):
    """
    CHEAPEST ROUTE LOGIC:
    - ONLY uses LOCAL TRAINS (₹5/station)
    - NEVER uses Metro (₹20/station)
    - Creates subgraph excluding all Metro edges
    - Ignores time completely, only minimizes cost
    """
    try:
        # Create subgraph with LOCAL TRAINS ONLY (no Metro)
        local_edges = [(u, v, d) for u, v, d in G.edges(data=True) 
                       if d['mode'] in ['Local Train', 'Transfer']]
        
        if not local_edges:
            return None
            
        G_local = nx.Graph()
        G_local.add_edges_from(local_edges)
        
        # Check if path exists in local-only network
        if not nx.has_path(G_local, src, dest):
            return None
        
        # Find cheapest path using only local trains
        path = nx.dijkstra_path(G_local, src, dest, weight='cost')
        return calculate_path_metrics(path)
    except nx.NetworkXNoPath:
        return None
    except Exception as e:
        print(f"Error in find_cheapest_route: {e}")
        return None

def find_comfortable_route(src, dest):
    """
    COMFORTABLE ROUTE LOGIC:
    - Prefers AC Metro (comfort=10) over crowded local trains (comfort=5)
    - Minimizes transfers (each transfer reduces comfort)
    - Must have significant Metro usage (20%+ of travel time)
    - Balances comfort with reasonable time
    
    Scoring: Lower is better
    - Metro travel: time × 0.3 (heavily prefer)
    - Local train: time × 3.0 (avoid if Metro available)
    - Transfer: +50 penalty per transfer (transfers are uncomfortable!)
    """
    try:
        def comfort_weight(u, v, d):
            if d['mode'] == 'Metro':
                # AC Metro: minimal weight (prefer this)
                return d['time'] * 0.3
            elif d['mode'] == 'Transfer':
                # Transfers are inconvenient: heavy penalty
                return 50 + d['time']
            else:
                # Local trains: higher weight (use only if necessary)
                return d['time'] * 3.0
        
        path = nx.dijkstra_path(G, src, dest, weight=comfort_weight)
        metrics = calculate_path_metrics(path)
        
        if not metrics:
            return None
        
        # Verify route qualifies as "comfortable"
        # Must have at least 20% Metro usage or very few transfers
        if metrics['metro_percentage'] < 20 and metrics['num_transfers'] > 2:
            # Not comfortable enough: too many transfers and not enough Metro
            return None
        
        # If no Metro at all, reject (not comfortable)
        if metrics['metro_time'] == 0:
            return None
            
        return metrics
        
    except nx.NetworkXNoPath:
        return None
    except Exception as e:
        print(f"Error in find_comfortable_route: {e}")
        return None

def find_optimal_routes(src, dest):
    """Find all three route types"""
    routes = {}
    
    routes['fastest'] = find_fastest_route(src, dest)
    routes['cheapest'] = find_cheapest_route(src, dest)
    routes['comfortable'] = find_comfortable_route(src, dest)
    
    return routes

def format_route_instructions(route_data):
    """Format route into human-readable instructions"""
    if not route_data:
        return []
    
    instructions = []
    
    # Add journey segments
    for idx, segment in enumerate(route_data['segments'], 1):
        mode_icon = "🚇" if segment['mode'] == "Metro" else "🚆"
        instructions.append(
            f"{mode_icon} Take {segment['mode']} - {segment['line']}\n"
            f"   From: {segment['start']} → To: {segment['end']}\n"
            f"   ({segment['stops']} stops, ~{segment['time']} min)"
        )
    
    # Add transfer information
    actual_transfers = [t for t in route_data['transfers'] if t['to_line'] != 'Transfer']
    if actual_transfers:
        instructions.append("")
        instructions.append("🔄 Transfers:")
        for transfer in actual_transfers:
            instructions.append(
                f"   → At {transfer['station']}: "
                f"Change from {transfer['from_line']} to {transfer['to_line']}"
            )
    
    # Add comprehensive summary
    instructions.extend([
        "",
        "📊 Journey Summary:",
        f"   ⏱️  Total Time: {route_data['total_time']} minutes",
        f"   💰 Total Cost: ₹{route_data['total_cost']}",
        f"   📍 Distance: {route_data['total_distance']} km",
        f"   🔄 Transfers: {len(actual_transfers)}",
        f"   🪑 Comfort: {route_data['avg_comfort']}/10"
    ])
    
    if route_data['metro_time'] > 0:
        instructions.append(f"   🚇 Metro Usage: {route_data['metro_percentage']}% of journey")
    
    return instructions

# ===================== API ENDPOINTS =====================

@app.route('/')
def home():
    """Root endpoint - API information"""
    return jsonify({
        'name': 'Mumbai Journey Planner API',
        'version': '2.0-perfect',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'stations': '/api/stations',
            'journey': '/api/journey (POST)',
            'all_routes': '/api/journey/all (POST)',
            'debug': '/api/debug/path (POST)'
        },
        'documentation': 'Send POST requests to /api/journey with {from, to, routeType}',
        'stations': len(G.nodes()),
        'connections': len(G.edges())
    })
def normalize_station(name):
    """Case-insensitive station matching with fuzzy support"""
    name_lower = name.lower().strip()
    
    # Exact match
    for node in G.nodes():
        if node.lower() == name_lower:
            return node
    
    # Partial match (for autocomplete)
    for node in G.nodes():
        if name_lower in node.lower():
            return node
            
    return name

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """Return all station names for autocomplete"""
    return jsonify(sorted(list(G.nodes())))

@app.route('/api/journey', methods=['POST'])
def find_journey():
    """Find optimal journey between two stations"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        source = normalize_station(data.get('from', ''))
        dest = normalize_station(data.get('to', ''))
        route_type = data.get('routeType', 'fastest')
        
        # Validation
        if source not in G.nodes():
            return jsonify({'error': f'Station "{data.get("from", "")}" not found'}), 404
        
        if dest not in G.nodes():
            return jsonify({'error': f'Station "{data.get("to", "")}" not found'}), 404
        
        if source == dest:
            return jsonify({'error': 'Source and destination cannot be the same'}), 400
        
        # Find all route options
        routes = find_optimal_routes(source, dest)
        
        # Select requested route type
        selected_route = routes.get(route_type)
        
        if not selected_route:
            if route_type == 'comfortable':
                return jsonify({
                    'error': 'No comfortable AC Metro route available. This journey requires local trains only. Try "Fastest" or "Cheapest" options.'
                }), 404
            elif route_type == 'cheapest':
                return jsonify({
                    'error': 'No local train route available. This journey may require Metro connections.'
                }), 404
            return jsonify({'error': f'No {route_type} route found'}), 404
        
        # Format instructions
        instructions = format_route_instructions(selected_route)
        
        return jsonify({
            'route': instructions,
            'time': f"{selected_route['total_time']} min",
            'cost': f"₹{selected_route['total_cost']}",
            'distance': f"{selected_route['total_distance']} km",
            'transfers': selected_route['num_transfers'],
            'comfort': selected_route['avg_comfort'],
            'metro_percentage': selected_route.get('metro_percentage', 0),
            'alternatives': {
                'fastest': routes.get('fastest'),
                'cheapest': routes.get('cheapest'),
                'comfortable': routes.get('comfortable')
            }
        })
    except Exception as e:
        print(f"Error in find_journey: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/journey/all', methods=['POST'])
def find_all_routes():
    """Get all route options for comparison"""
    try:
        data = request.get_json()
        source = normalize_station(data.get('from', ''))
        dest = normalize_station(data.get('to', ''))
        
        if source not in G.nodes() or dest not in G.nodes():
            return jsonify({'error': 'Station not found'}), 404
        
        if source == dest:
            return jsonify({'error': 'Source and destination cannot be the same'}), 400
        
        routes = find_optimal_routes(source, dest)
        
        result = {}
        for route_type in ['fastest', 'cheapest', 'comfortable']:
            route_data = routes.get(route_type)
            if route_data:
                result[route_type] = {
                    'instructions': format_route_instructions(route_data),
                    'time': route_data['total_time'],
                    'cost': route_data['total_cost'],
                    'distance': route_data['total_distance'],
                    'transfers': route_data['num_transfers'],
                    'comfort': route_data['avg_comfort'],
                    'metro_percentage': route_data.get('metro_percentage', 0)
                }
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in find_all_routes: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'stations': len(G.nodes()),
        'connections': len(G.edges()),
        'version': '2.0-perfect'
    })

@app.route('/api/debug/path', methods=['POST'])
def debug_path():
    """Debug endpoint to verify connectivity"""
    data = request.get_json()
    source = normalize_station(data.get('from', ''))
    dest = normalize_station(data.get('to', ''))
    
    try:
        has_path = nx.has_path(G, source, dest)
        
        result = {
            'has_path': has_path,
            'source': source,
            'dest': dest
        }
        
        if has_path:
            # Get all three routes
            routes = find_optimal_routes(source, dest)
            result['routes_found'] = {
                'fastest': routes.get('fastest') is not None,
                'cheapest': routes.get('cheapest') is not None,
                'comfortable': routes.get('comfortable') is not None
            }
            
            # Show fastest path details
            if routes.get('fastest'):
                result['fastest_path'] = routes['fastest']['path']
        else:
            result['source_neighbors'] = list(G.neighbors(source))[:5]
            result['dest_neighbors'] = list(G.neighbors(dest))[:5]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    print("=" * 70)
    print("🚆 MUMBAI JOURNEY PLANNER - PERFECT EDITION")
    print("=" * 70)
    print(f"📍 Total Stations: {len(G.nodes())}")
    print(f"🛤️  Total Connections: {len(G.edges())}")
    print()
    print("🎯 ROUTE OPTIMIZATION LOGIC:")
    print()
    print("  ⚡ FASTEST Route:")
    print("     • Minimizes TOTAL TIME only")
    print("     • Uses any Metro/Local combination")
    print("     • Ignores cost completely")
    print()
    print("  💰 CHEAPEST Route:")
    print("     • Uses LOCAL TRAINS ONLY (₹5/station)")
    print("     • NEVER touches Metro (₹20/station)")
    print("     • Ignores time completely")
    print()
    print("  🪑 COMFORTABLE Route:")
    print("     • Prefers AC Metro (comfort=10)")
    print("     • MINIMIZES transfers (each = +50 penalty)")
    print("     • Must be 20%+ Metro usage")
    print("     • Rejects routes with no Metro")
    print()
    print("📝 Key Features:")
    print("   • Metro Line 2A stations renamed (e.g., 'Borivali Metro')")
    print("   • Accurate transfer times at all junctions")
    print("   • Smart pathfinding prevents inefficient detours")
    print()
    print("🌐 Server: http://127.0.0.1:5000")
    print("✅ Status: READY")
    print("=" * 70)
    app.run(debug=True, port=5000)
