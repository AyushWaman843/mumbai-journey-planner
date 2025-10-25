import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Autosuggest from 'react-autosuggest';
import './App.css';
import MapView from './MapView';
import train from './assets/train.png';

// Use environment variable in production, deployed backend as fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://mumbai-journey-planner.onrender.com';

function Home({
  stations, setStations,
  routeType, setRouteType,
  error, setError,
  loading, setLoading,
  routeResult, setRouteResult,
  allRoutes, setAllRoutes
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load stations with retry logic
    const loadStations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stations`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStations(data);
        setIsWakingUp(false);
      } catch (err) {
        console.error('Failed to load stations:', err);
        // If first attempt fails, backend might be waking up
        setIsWakingUp(true);
        // Retry after 5 seconds
        setTimeout(() => {
          fetch(`${API_URL}/api/stations`)
            .then(res => res.json())
            .then(data => {
              setStations(data);
              setIsWakingUp(false);
            })
            .catch(() => setIsWakingUp(false));
        }, 5000);
      }
    };
    
    loadStations();
  }, [setStations]);

  function getSuggestions(value) {
    const input = value.trim().toLowerCase();
    return input.length === 0
      ? []
      : stations.filter(station =>
          station.toLowerCase().includes(input)
        ).slice(0, 8);
  }

  // Autosuggest handlers for FROM
  const onFromChange = (e, { newValue }) => setFrom(newValue);
  const onFromSuggestionsFetchRequested = ({ value }) => setFromSuggestions(getSuggestions(value));
  const onFromSuggestionsClearRequested = () => setFromSuggestions([]);
  
  // Autosuggest handlers for TO
  const onToChange = (e, { newValue }) => setTo(newValue);
  const onToSuggestionsFetchRequested = ({ value }) => setToSuggestions(getSuggestions(value));
  const onToSuggestionsClearRequested = () => setToSuggestions([]);

  async function handleFindRoute() {
    if (!from || !to) {
      setError('Please enter both stations!');
      setRouteResult(null);
      return;
    }
    
    setError('');
    setRouteResult(null);
    setAllRoutes(null);
    setLoading(true);

    try {
      // Main journey request
      const journeyRes = await fetch(`${API_URL}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, routeType })
      });
      
      const journeyData = await journeyRes.json();
      
      if (journeyData.error) {
        setError(journeyData.error);
      } else {
        setRouteResult(journeyData);
      }
      
      // Fetch all routes for comparison
      const allRoutesRes = await fetch(`${API_URL}/api/journey/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      });
      
      const allRoutesData = await allRoutesRes.json();
      if (!allRoutesData.error) {
        setAllRoutes(allRoutesData);
      }
      
    } catch (err) {
      console.error('Connection error:', err);
      setError('⏳ Server is waking up (this takes 30-60 seconds on first load). Please wait a moment and try again!');
    } finally {
      setLoading(false);
    }
  }

  function swapStations() {
    const temp = from;
    setFrom(to);
    setTo(temp);
  }

  return (
    <div className="mumbai-card">
      {/* Train Image */}
      <img
        src={train}
        alt="Mumbai Local Train"
        className="mumbai-train-img"
      />
      
      {/* Header */}
      <div className="mumbai-title">Mumbai Journey Planner</div>
      <div className="mumbai-desc">
        Find the best route across Mumbai Local & Metro
      </div>
      
      {/* Wake-up notification */}
      {isWakingUp && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#92400e',
          textAlign: 'center'
        }}>
          ⏳ Loading stations... Server is waking up (may take 30-60 seconds)
        </div>
      )}
      
      {/* Input Section */}
      <div className="mumbai-input-row">
        <Autosuggest
          suggestions={fromSuggestions}
          onSuggestionsFetchRequested={onFromSuggestionsFetchRequested}
          onSuggestionsClearRequested={onFromSuggestionsClearRequested}
          getSuggestionValue={suggestion => suggestion}
          renderSuggestion={suggestion => <span>{suggestion}</span>}
          inputProps={{
            placeholder: 'From station',
            value: from,
            onChange: onFromChange,
            disabled: isWakingUp
          }}
        />
        
        <div style={{ textAlign: 'center', margin: '-8px 0' }}>
          <button
            onClick={swapStations}
            disabled={isWakingUp}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isWakingUp ? 'not-allowed' : 'pointer',
              padding: '4px',
              color: '#3b82f6',
              opacity: isWakingUp ? 0.5 : 1
            }}
            title="Swap stations"
          >
            ⇅
          </button>
        </div>
        
        <Autosuggest
          suggestions={toSuggestions}
          onSuggestionsFetchRequested={onToSuggestionsFetchRequested}
          onSuggestionsClearRequested={onToSuggestionsClearRequested}
          getSuggestionValue={suggestion => suggestion}
          renderSuggestion={suggestion => <span>{suggestion}</span>}
          inputProps={{
            placeholder: 'To station',
            value: to,
            onChange: onToChange,
            disabled: isWakingUp
          }}
        />
      </div>
      
      {/* Route Type Selection */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { value: 'fastest', label: '⚡ Fastest', color: '#3b82f6' },
          { value: 'cheapest', label: '💰 Cheapest', color: '#10b981' },
          { value: 'comfortable', label: '🪑 Comfort', color: '#8b5cf6' }
        ].map(option => (
          <label
            key={option.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: routeType === option.value ? option.color : '#f1f5f9',
              color: routeType === option.value ? 'white' : '#475569',
              borderRadius: '8px',
              cursor: isWakingUp ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              border: '2px solid transparent',
              opacity: isWakingUp ? 0.5 : 1
            }}
          >
            <input
              type="radio"
              name="routeType"
              value={option.value}
              checked={routeType === option.value}
              onChange={e => setRouteType(e.target.value)}
              disabled={isWakingUp}
              style={{ display: 'none' }}
            />
            {option.label}
          </label>
        ))}
      </div>
      
      <button
        className="mumbai-btn"
        onClick={handleFindRoute}
        disabled={loading || isWakingUp}
        style={{ 
          opacity: (loading || isWakingUp) ? 0.6 : 1, 
          cursor: (loading || isWakingUp) ? 'not-allowed' : 'pointer' 
        }}
      >
        {loading ? '🔍 Finding Best Route...' : isWakingUp ? '⏳ Waking Server...' : '🚀 Find Route'}
      </button>
      
      {error && (
        <div className="mumbai-error">
          ⚠️ {error}
        </div>
      )}
      
      {routeResult && (
        <div className="mumbai-route-result">
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>⏱️ Time</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0ea5e9' }}>
                {routeResult.time}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>💰 Cost</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                {routeResult.cost}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>📍 Distance</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                {routeResult.distance}
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>🔄 Changes</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                {routeResult.transfers}
              </div>
            </div>
          </div>
          
          {/* Detailed Instructions */}
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#1e293b',
            border: '1px solid #bfdbfe'
          }}>
            {routeResult.route.map((line, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: line === '' ? '8px' : '4px',
                  fontWeight: line.startsWith('🚆') || line.startsWith('🚇') || line.startsWith('⏱️') || line.startsWith('💰') ? '600' : '400',
                  color: line.startsWith('🔄') ? '#6366f1' : '#1e293b'
                }}
              >
                {line}
              </div>
            ))}
          </div>
          
          <button
            className="mumbai-btn"
            style={{ marginTop: '16px', width: '100%' }}
            onClick={() => navigate('/map')}
          >
            🗺️ View Map
          </button>
        </div>
      )}
      
      {allRoutes && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            📊 Compare All Routes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(allRoutes).map(([type, data]) => (
              <div
                key={type}
                onClick={() => {
                  setRouteType(type);
                  handleFindRoute();
                }}
                style={{
                  padding: '14px',
                  background: routeType === type ? '#dbeafe' : '#f8fafc',
                  border: routeType === type ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', textTransform: 'capitalize', color: '#1e40af' }}>
                    {type === 'fastest' ? '⚡ Fastest' : type === 'cheapest' ? '💰 Cheapest' : '🪑 Comfortable'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                    {data.time} min
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#64748b'
                }}>
                  <span>₹{data.cost}</span>
                  <span>•</span>
                  <span>{data.distance} km</span>
                  <span>•</span>
                  <span>{data.transfers} changes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        Covers {stations.length}+ stations • Local Trains + Metro
      </div>
    </div>
  );
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [routeType, setRouteType] = useState('fastest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [allRoutes, setAllRoutes] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              stations={stations}
              setStations={setStations}
              routeType={routeType}
              setRouteType={setRouteType}
              error={error}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
              routeResult={routeResult}
              setRouteResult={setRouteResult}
              allRoutes={allRoutes}
              setAllRoutes={setAllRoutes}
            />
          }
        />
        <Route
          path="/map"
          element={
            <MapView
              stations={stations}
              allRoutes={allRoutes}
              routeResult={routeResult}
              onClose={() => window.history.back()}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
