import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler 
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
);

const Analytics = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    source: '',
    startDate: '',
    endDate: ''
  });
  const [analytics, setAnalytics] = useState({
    byType: {},
    bySeverity: {},
    bySource: {},
    timeline: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        
        // Use the analytics endpoint
        const response = await axios.get('http://localhost:5000/api/disasters/analytics', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
    
        console.log('Analytics Response:', {
          total: response.data?.length,
          types: [...new Set(response.data?.map(d => d.type))]
        });
    
        if (response.data && Array.isArray(response.data)) {
          setDisasters(response.data);
          processAnalytics(response.data);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Invalid data format received');
        }
      } catch (error) {
        console.error('Analytics Error:', error);
        setError(`Failed to fetch data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const processAnalytics = (data) => {
    if (!Array.isArray(data)) {
      console.error('processAnalytics received non-array data:', data);
      return;
    }

    const byType = {};
    const bySeverity = {};
    const bySource = {};
    const timeline = {};

    data.forEach(disaster => {
      if (disaster && typeof disaster === 'object') {
        const type = disaster.type || 'Unknown';
        byType[type] = (byType[type] || 0) + 1;

        const severity = disaster.severity?.toUpperCase() || 'UNKNOWN';
        bySeverity[severity] = (bySeverity[severity] || 0) + 1;

        const source = disaster.source || 'Unknown';
        bySource[source] = (bySource[source] || 0) + 1;
        
        const date = new Date(disaster.timestamp).toLocaleDateString();
        timeline[date] = (timeline[date] || 0) + 1;
      }
    });

    setAnalytics({ byType, bySeverity, bySource, timeline });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const getFilteredDisasters = () => {
    return disasters.filter(disaster => {
      const date = new Date(disaster.timestamp);
      return (!filters.type || disaster.type === filters.type) &&
             (!filters.severity || disaster.severity === filters.severity) &&
             (!filters.source || disaster.source === filters.source) &&
             (!filters.startDate || date >= new Date(filters.startDate)) &&
             (!filters.endDate || date <= new Date(filters.endDate));
    });
  };

  const formatLocation = (location) => {
    if (!location) return 'Unknown Location';
    
    if (typeof location === 'string') {
      return location.replace(/\s+\d+$/, '');
    }
    
    if (typeof location === 'object') {
      return location.address || location.name || location.city || 
             location.coordinates?.join(', ') || 'Unknown Location';
    }
    
    return 'Unknown Location';
  };

  if (loading) return <div className="loading">Loading disaster data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!disasters.length) return <div className="no-data">No disaster data available</div>;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    height: 300,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Count: ${context.raw}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const pieChartOptions = {
    ...chartOptions,
    aspectRatio: 1,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 10
        }
      }
    }
  };

  return (
    <div className="analytics-container">
      <h1>Disaster Analytics Dashboard</h1>
      
      <div className="summary-cards">
        <div className="card">
          <h3>Total Incidents</h3>
          <p>{disasters.length}</p>
          <small>All recorded disasters</small>
        </div>
        <div className="card">
          <h3>Critical Events</h3>
          <p>{disasters.filter(d => d.severity?.toUpperCase() === 'HIGH').length}</p>
          <small>High severity incidents</small>
        </div>
        <div className="card">
          <h3>Active Sources</h3>
          <p>{Object.keys(analytics.bySource).length}</p>
          <small>Reporting channels</small>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Disaster Categories</h2>
          <div className="chart-container">
            <Bar
              data={{
                labels: Object.keys(analytics.byType),
                datasets: [{
                  label: 'Number of Events',
                  data: Object.values(analytics.byType),
                  backgroundColor: 'rgba(53, 162, 235, 0.7)',
                  borderColor: 'rgba(53, 162, 235, 1)',
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>

        <div className="chart-card">
          <h2>Severity Levels</h2>
          <div className="chart-container">
            <Pie
              data={{
                labels: Object.keys(analytics.bySeverity),
                datasets: [{
                  data: Object.values(analytics.bySeverity),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                  ],
                  borderWidth: 1
                }]
              }}
              options={pieChartOptions}
            />
          </div>
        </div>

        <div className="chart-card">
          <h2>Incident Timeline</h2>
          <div className="chart-container">
            <Line
              data={{
                labels: Object.keys(analytics.timeline),
                datasets: [{
                  label: 'Daily Events',
                  data: Object.values(analytics.timeline),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  tension: 0.1,
                  fill: true
                }]
              }}
              options={{
                ...chartOptions,
                aspectRatio: 2,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Incidents'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="disaster-list">
        <h2>Recent Disasters</h2>
        <div className="filters">
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="">All Types</option>
            {Object.keys(analytics.byType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select name="severity" value={filters.severity} onChange={handleFilterChange}>
            <option value="">All Severities</option>
            {Object.keys(analytics.bySeverity).map(severity => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>

          <select name="source" value={filters.source} onChange={handleFilterChange}>
            <option value="">All Sources</option>
            {Object.keys(analytics.bySource).map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            placeholder="Start Date"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            placeholder="End Date"
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredDisasters().map((disaster, index) => (
                <tr key={index} className={`severity-${disaster.severity?.toLowerCase()}`}>
                  <td>{disaster.type}</td>
                  <td>{disaster.title}</td>
                  <td>{formatLocation(disaster.location)}</td>
                  <td>{disaster.severity}</td>
                  <td>{new Date(disaster.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;