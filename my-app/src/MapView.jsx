import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Home, Menu, X } from 'lucide-react';
import map from './assets/map.jpg';

export default function MapView({ stations, allRoutes, routeResult, onClose }) {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 100, y: -700 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [highlightedSegments, setHighlightedSegments] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.7);
  const [imageScale, setImageScale] = useState(1.09);
  const [imagePosition, setImagePosition] = useState({ x: -320, y: -40 });
  const [showImageControls, setShowImageControls] = useState(true);
  const mapRef = useRef(null);

  // Preload image properly for mobile compatibility
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBackgroundImage(map);
    };
    img.onerror = () => {
      console.error('Failed to load map image');
      setBackgroundImage(map); // Try anyway
    };
    img.src = map;
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Station positions - Complete and accurate
  const stationPositions = {
    // Western Line
    "Churchgate": {x: 160, y: 1550},
    "Marine Lines": {x: 170, y: 1520},
    "Charni Road": {x: 210, y: 1490},
    "Grant Road": {x: 220, y: 1460},
    "Mumbai Central": {x: 240, y: 1420},
    "Mahalakshmi": {x: 255, y: 1380},
    "Lower Parel": {x: 280, y: 1340},
    "Prabhadevi": {x: 285, y: 1300},
    "Dadar": {x: 320, y: 1260},
    "Matunga Road": {x: 370, y: 1220},
    "Mahim Junction": {x: 365, y: 1180},
    "Bandra": {x: 365, y: 1140},
    "Khar Road": {x: 360, y: 1100},
    "Santacruz": {x: 350, y: 1060},
    "Vile Parle": {x: 330, y: 1020},
    "Andheri": {x: 340, y: 980},
    "Jogeshwari": {x: 350, y: 940},
    "Ram Mandir": {x: 360, y: 900},
    "Goregaon": {x: 370, y: 860},
    "Malad": {x: 380, y: 820},
    "Kandivali": {x: 390, y: 780},
    "Borivali": {x: 400, y: 740},
    "Dahisar": {x: 410, y: 700},
    "Mira Road": {x: 420, y: 650},
    "Bhayander": {x: 430, y: 600},
    "Naigaon": {x: 440, y: 550},
    "Vasai Road": {x: 450, y: 500},
    "Nalla Sopara": {x: 460, y: 450},
    "Virar": {x: 470, y: 400},

    // Central Main Line
    "CSMT": {x: 280, y: 1550},
    "Masjid": {x: 285, y: 1520},
    "Sandhurst Road": {x: 290, y: 1490},
    "Byculla": {x: 290, y: 1450},
    "Chinchpokli": {x: 295, y: 1410},
    "Currey Road": {x: 295, y: 1370},
    "Parel": {x: 290, y: 1330},
    "Matunga": {x: 390, y: 1220},
    "Sion": {x: 470, y: 1200},
    "Kurla": {x: 550, y: 1140},
    "Vidyavihar": {x: 570, y: 1100},
    "Ghatkopar": {x: 580, y: 1060},
    "Vikhroli": {x: 590, y: 1020},
    "Kanjur Marg": {x: 600, y: 990},
    "Bhandup": {x: 620, y: 960},
    "Nahur": {x: 640, y: 930},
    "Mulund": {x: 660, y: 900},
    "Thane": {x: 700, y: 870},
    "Kalva": {x: 740, y: 850},
    "Mumbra": {x: 780, y: 840},
    "Diva Junction": {x: 820, y: 830},
    "Kopar": {x: 860, y: 820},
    "Dombivli": {x: 900, y: 810},
    "Thakurli": {x: 940, y: 800},
    "Kalyan": {x: 980, y: 790},

    // Central Kasara Branch
    "Shahad": {x: 1020, y: 770},
    "Ambivli": {x: 1060, y: 740},
    "Titwala": {x: 1100, y: 700},
    "Khadavli": {x: 1140, y: 650},
    "Vasind": {x: 1180, y: 590},
    "Asangaon": {x: 1220, y: 530},
    "Atgaon": {x: 1260, y: 470},
    "Thansit": {x: 1300, y: 410},
    "Khardi": {x: 1340, y: 350},
    "Umbermali": {x: 1380, y: 290},
    "Kasara": {x: 1420, y: 230},

    // Central Karjat Branch
    "Vithalwadi": {x: 1010, y: 810},
    "Ulhasnagar": {x: 1040, y: 830},
    "Ambarnath": {x: 1080, y: 850},
    "Badlapur": {x: 1130, y: 880},
    "Vangani": {x: 1180, y: 920},
    "Shelu": {x: 1220, y: 960},
    "Neral": {x: 1260, y: 1010},
    "Bhivpuri Road": {x: 1290, y: 1060},
    "Karjat": {x: 1320, y: 1120},

    // Harbour Line
    "Dockyard Road": {x: 310, y: 1470},
    "Reay Road": {x: 330, y: 1430},
    "Cotton Green": {x: 370, y: 1390},
    "Sewri": {x: 370, y: 1330},
    "Vadala Road": {x: 370, y: 1260},
    "GTB Nagar": {x: 410, y: 1230},
    "Chunabhatti": {x: 500, y: 1190},
    "Tilak Nagar": {x: 580, y: 1130},
    "Chembur": {x: 630, y: 1120},
    "Govandi": {x: 680, y: 1110},
    "Mankhurd": {x: 720, y: 1130},
    "Vashi": {x: 750, y: 1190},
    "Sanpada": {x: 780, y: 1240},
    "Juinagar": {x: 820, y: 1270},
    "Nerul": {x: 860, y: 1300},
    "Seawood Darave": {x: 900, y: 1330},
    "Belapur CBD": {x: 940, y: 1360},
    "Kharghar": {x: 980, y: 1400},
    "Mansarovar": {x: 1020, y: 1440},
    "Khandeshwar": {x: 1060, y: 1480},
    "Panvel": {x: 1100, y: 1520},

    // Trans-Harbour Line
    "Airoli": {x: 780, y: 920},
    "Rabale": {x: 820, y: 970},
    "Ghansoli": {x: 860, y: 1020},
    "Koparkhairane": {x: 900, y: 1070},
    "Turbhe": {x: 890, y: 1170},

    // Metro Line 1
    "Versova": {x: 270, y: 1040},
    "D.N. Nagar": {x: 290, y: 1030},
    "Azad Nagar": {x: 310, y: 1010},
    "Western Express Highway": {x: 370, y: 990},
    "Chakala": {x: 400, y: 980},
    "Airport Road": {x: 450, y: 980},
    "Marol Naka": {x: 480, y: 990},
    "Saki Naka": {x: 495, y: 1010},
    "Jagruti Nagar": {x: 515, y: 1035},
    "Asalpha": {x: 530, y: 1055},

    // Metro Line 2A stations
    "Dahisar East": {x: 430, y: 700},
    "Anand Nagar": {x: 425, y: 720},
    "Dahisar West": {x: 420, y: 705},
    "Ovaripada": {x: 420, y: 740},
    "Magathane": {x: 415, y: 760},
    "Devipada": {x: 410, y: 780},
    "Kandivali Metro": {x: 405, y: 800},
    "Poisar": {x: 400, y: 820},
    "Mandapeshwar": {x: 395, y: 840},
    "Borivali Metro": {x: 415, y: 740},
    "Eksar": {x: 390, y: 860},
    "Goregaon Metro": {x: 385, y: 880},
    "Malad Metro": {x: 395, y: 830},
    "Kurar Village": {x: 380, y: 900},
    "Aarey": {x: 375, y: 920},
    "JVLR": {x: 370, y: 940},
    "Jogeshwari Metro": {x: 365, y: 960},
    "Vile Parle Metro": {x: 350, y: 1020},

    // Metro Line 7 stations
    "Mahavir Nagar": {x: 440, y: 720},
    "Pushpa Park": {x: 450, y: 750},
    "Akurli Road": {x: 460, y: 780},
    "MTNL": {x: 470, y: 820},
    "Andheri East": {x: 360, y: 980},
  };

  // Line definitions
  const lines = [
    {
      name: "Western Line",
      color: "#dc2626",
      stations: ["Churchgate", "Marine Lines", "Charni Road", "Grant Road", "Mumbai Central",
        "Mahalakshmi", "Lower Parel", "Prabhadevi", "Dadar", "Matunga Road",
        "Mahim Junction", "Bandra", "Khar Road", "Santacruz", "Vile Parle",
        "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon", "Malad",
        "Kandivali", "Borivali", "Dahisar", "Mira Road", "Bhayander",
        "Naigaon", "Vasai Road", "Nalla Sopara", "Virar"]
    },
    {
      name: "Central Main",
      color: "#2563eb",
      stations: ["CSMT", "Masjid", "Sandhurst Road", "Byculla", "Chinchpokli",
        "Currey Road", "Parel", "Dadar", "Matunga", "Sion",
        "Kurla", "Vidyavihar", "Ghatkopar", "Vikhroli", "Kanjur Marg",
        "Bhandup", "Nahur", "Mulund", "Thane", "Kalva",
        "Mumbra", "Diva Junction", "Kopar", "Dombivli", "Thakurli", "Kalyan"]
    },
    {
      name: "Central Kasara",
      color: "#1e40af",
      stations: ["Kalyan", "Shahad", "Ambivli", "Titwala", "Khadavli",
        "Vasind", "Asangaon", "Atgaon", "Thansit", "Khardi",
        "Umbermali", "Kasara"]
    },
    {
      name: "Central Karjat",
      color: "#1e3a8a",
      stations: ["Kalyan", "Vithalwadi", "Ulhasnagar", "Ambarnath", "Badlapur",
        "Vangani", "Shelu", "Neral", "Bhivpuri Road", "Karjat"]
    },
    {
      name: "Harbour Line",
      color: "#059669",
      stations: ["CSMT", "Masjid", "Sandhurst Road", "Dockyard Road", "Reay Road",
        "Cotton Green", "Sewri", "Vadala Road", "GTB Nagar", "Chunabhatti",
        "Kurla", "Tilak Nagar", "Chembur", "Govandi", "Mankhurd",
        "Vashi", "Sanpada", "Juinagar", "Nerul", "Seawood Darave",
        "Belapur CBD", "Kharghar", "Mansarovar", "Khandeshwar", "Panvel"]
    },
    {
      name: "Trans-Harbour",
      color: "#0891b2",
      stations: ["Thane", "Airoli", "Rabale", "Ghansoli", "Koparkhairane",
        "Turbhe", "Juinagar", "Nerul", "Seawood Darave", "Belapur CBD",
        "Kharghar", "Mansarovar", "Khandeshwar", "Panvel"]
    },
    {
      name: "Metro Line 1",
      color: "#9333ea",
      stations: ["Versova", "D.N. Nagar", "Azad Nagar", "Andheri", "Western Express Highway",
        "Chakala", "Airport Road", "Marol Naka", "Saki Naka", "Jagruti Nagar",
        "Asalpha", "Ghatkopar"]
    },
    {
      name: "Metro Line 2A",
      color: "#c026d3",
      stations: ["Dahisar East", "Anand Nagar", "Dahisar West", "Ovaripada", "Magathane",
        "Devipada", "Kandivali Metro", "Poisar", "Mandapeshwar", "Borivali Metro",
        "Eksar", "Goregaon Metro", "Malad Metro", "Kurar Village", "Aarey",
        "JVLR", "Jogeshwari Metro", "Vile Parle Metro", "D.N. Nagar"]
    },
    {
      name: "Metro Line 7",
      color: "#db2777",
      stations: ["Dahisar East", "Mahavir Nagar", "Pushpa Park", "Akurli Road",
        "MTNL", "Andheri East"]
    }
  ];

  // Extract highlighted path from route result
  useEffect(() => {
    if (routeResult && routeResult.route) {
      const pathStations = [];
      const segments = [];
      
      routeResult.route.forEach(line => {
        const segmentMatch = line.match(/(?:🚆|🚇) Take .+ - (.+?)\s+From: (.+?) → To: (.+)/);
        if (segmentMatch) {
          const lineName = segmentMatch[1].trim();
          const startStation = segmentMatch[2].trim();
          const endStation = segmentMatch[3].trim();
          
          for (const railLine of lines) {
            const startIdx = railLine.stations.indexOf(startStation);
            const endIdx = railLine.stations.indexOf(endStation);
            
            if (startIdx !== -1 && endIdx !== -1) {
              const minIdx = Math.min(startIdx, endIdx);
              const maxIdx = Math.max(startIdx, endIdx);
              const segmentStations = railLine.stations.slice(minIdx, maxIdx + 1);
              
              pathStations.push(...segmentStations);
              segments.push({
                line: railLine.name,
                color: railLine.color,
                stations: segmentStations
              });
              break;
            }
          }
        }
      });
      
      const uniquePath = [...new Set(pathStations)];
      setHighlightedPath(uniquePath);
      setHighlightedSegments(segments);
    }
  }, [routeResult]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  
  const handleMouseMove = (e) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  
  const handleMouseUp = () => setIsDragging(false);
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };
  
  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };
  
  const resetView = () => {
    setZoom(0.8);
    setPan({ x: 100, y: -700 });
  };

  const isStationHighlighted = (station) => highlightedPath.includes(station);
  
  const isSegmentHighlighted = (station1, station2) => {
    const idx1 = highlightedPath.indexOf(station1);
    const idx2 = highlightedPath.indexOf(station2);
    return idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#f8fafc', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100, padding: isMobile ? '12px' : '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              borderRadius: '8px', padding: isMobile ? '6px 10px' : '8px 12px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: isMobile ? '12px' : '14px', fontWeight: '600'
            }}
          >
            <ArrowLeft size={isMobile ? 16 : 18} />
            Back
          </button>
          {!isMobile && (
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
              Mumbai Railway Network Map
            </h2>
          )}
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '6px',
              padding: isMobile ? '6px' : '8px', cursor: 'pointer'
            }}
          >
            <ZoomIn size={isMobile ? 18 : 20} />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '6px',
              padding: isMobile ? '6px' : '8px', cursor: 'pointer'
            }}
          >
            <ZoomOut size={isMobile ? 18 : 20} />
          </button>
          <button
            onClick={resetView}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '6px',
              padding: isMobile ? '6px' : '8px', cursor: 'pointer'
            }}
          >
            <Home size={isMobile ? 18 : 20} />
          </button>
        </div>
      </div>

      {/* Mobile Legend Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            position: 'absolute',
            top: '70px',
            right: '12px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100
          }}
        >
          {showLegend ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Legend */}
      {(!isMobile || showLegend) && (
        <div style={{
          position: 'absolute', 
          bottom: isMobile ? 'auto' : '120px',
          top: isMobile ? '120px' : 'auto',
          right: isMobile ? '12px' : '16px',
          background: 'white', 
          borderRadius: '10px', 
          padding: isMobile ? '12px' : '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 99,
          maxWidth: isMobile ? '180px' : '200px',
          maxHeight: isMobile ? 'calc(100vh - 200px)' : 'auto',
          overflowY: 'auto'
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: isMobile ? '12px' : '14px', 
            fontWeight: '700' 
          }}>
            Railway Lines
          </h3>
          {lines.map(line => (
            <div key={line.name} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '8px', fontSize: isMobile ? '10px' : '12px'
            }}>
              <div style={{
                width: isMobile ? '20px' : '24px', 
                height: '3px', 
                background: line.color,
                borderRadius: '2px',
                flexShrink: 0
              }} />
              <span>{line.name}</span>
            </div>
          ))}
          {highlightedPath.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: '600', 
                color: '#f59e0b'
              }}>
                <div style={{
                  width: isMobile ? '20px' : '24px', 
                  height: '4px', 
                  background: '#f59e0b',
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <span>Your Route</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Map Canvas */}
      <div
        ref={mapRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{
          position: 'absolute', 
          top: isMobile ? '60px' : '72px', 
          left: 0, 
          right: 0, 
          bottom: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          background: '#61797fff'
        }}
      >
        <svg
          width="3000"
          height="3000"
          viewBox="0 0 2400 2400"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Background Image - Fixed for mobile */}
          {backgroundImage && (
            <image
              xlinkHref={backgroundImage}
              x={imagePosition.x}
              y={imagePosition.y}
              width={1600 * imageScale}
              height={2000 * imageScale}
              opacity={imageOpacity}
              preserveAspectRatio="xMidYMid slice"
            />
          )}

          {/* Draw all railway lines */}
          {lines.map(line => (
            <g key={line.name}>
              {line.stations.map((station, idx) => {
                if (idx === line.stations.length - 1) return null;
                const nextStation = line.stations[idx + 1];
                const pos1 = stationPositions[station];
                const pos2 = stationPositions[nextStation];
                
                if (!pos1 || !pos2) return null;
                
                const highlighted = isSegmentHighlighted(station, nextStation);
                
                return (
                  <line
                    key={`${station}-${nextStation}`}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={highlighted ? '#f59e0b' : line.color}
                    strokeWidth={highlighted ? 5 : 3}
                    strokeLinecap="round"
                    opacity={highlighted ? 1 : (highlightedPath.length > 0 ? 0.3 : 0.8)}
                  />
                );
              })}
            </g>
          ))}

          {/* Draw stations */}
          {Object.entries(stationPositions).map(([name, pos]) => {
            const highlighted = isStationHighlighted(name);
            const westernLineStations = [
              "Churchgate", "Marine Lines", "Charni Road", "Grant Road", "Mumbai Central",
              "Mahalakshmi", "Lower Parel", "Prabhadevi", "Matunga Road",
              "Mahim Junction", "Bandra", "Khar Road", "Santacruz", "Vile Parle",
              "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon", "Malad",
              "Kandivali", "Borivali", "Dahisar", "Mira Road", "Bhayander",
              "Naigaon", "Vasai Road", "Nalla Sopara", "Virar"
            ];
            
            const isWesternLine = westernLineStations.includes(name);
            return (
              <g key={name}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={highlighted ? 8 : 5}
                  fill={highlighted ? '#f59e0b' : 'white'}
                  stroke={highlighted ? '#d97706' : '#64748b'}
                  strokeWidth={highlighted ? 3 : 2}
                  opacity={highlighted ? 1 : (highlightedPath.length > 0 ? 0.4 : 0.9)}
                />
                {(highlighted || highlightedPath.length === 0) && (
                  <text
                    x={isWesternLine ? pos.x - 10 : pos.x + 10}
                    y={pos.y + 4}
                    textAnchor={isWesternLine ? 'end' : 'start'}
                    fontSize="11"
                    fontWeight={highlighted ? '700' : '500'}
                    fill={highlighted ? '#92400e' : '#1e293b'}
                  >
                    {name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile Route Info Toggle Button */}
      {isMobile && routeResult && !showRouteInfo && (
        <button
          onClick={() => setShowRouteInfo(true)}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 20px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          Show Journey Details
        </button>
      )}

      {/* Route Info Panel */}
      {routeResult && (!isMobile || showRouteInfo) && (
        <div style={{
          position: 'absolute', 
          bottom: isMobile ? '16px' : '16px', 
          left: isMobile ? '16px' : '16px',
          right: isMobile ? '16px' : 'auto',
          background: 'white', 
          borderRadius: '10px', 
          padding: isMobile ? '12px' : '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          zIndex: 99,
          maxWidth: isMobile ? 'calc(100% - 32px)' : '400px'
        }}>
          {isMobile && (
            <button
              onClick={() => setShowRouteInfo(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} color="#64748b" />
            </button>
          )}
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: isMobile ? '14px' : '16px', 
            fontWeight: '700',
            paddingRight: isMobile ? '24px' : '0'
          }}>
            🚆 Journey Details
          </h3>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', 
            gap: isMobile ? '10px' : '12px',
            fontSize: isMobile ? '11px' : '13px'
          }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Time</div>
              <div style={{ fontWeight: '700', color: '#0ea5e9', fontSize: isMobile ? '13px' : '15px' }}>
                {routeResult.time}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Cost</div>
              <div style={{ fontWeight: '700', color: '#10b981', fontSize: isMobile ? '13px' : '15px' }}>
                {routeResult.cost}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Distance</div>
              <div style={{ fontWeight: '700', color: '#f59e0b', fontSize: isMobile ? '13px' : '15px' }}>
                {routeResult.distance}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Changes</div>
              <div style={{ fontWeight: '700', color: '#8b5cf6', fontSize: isMobile ? '13px' : '15px' }}>
                {routeResult.transfers}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
