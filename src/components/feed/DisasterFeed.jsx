import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilter, FaSort, FaCalendar } from 'react-icons/fa';
import './DisasterFeed.css';

function DisasterFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    startDate: '',
    endDate: ''
  });
  const [sort, setSort] = useState('-timestamp');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  // Update fetchReports function
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const params = {
        type: filters.type || undefined,
        severity: filters.severity || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sort: sort,
        page: page,
        limit: 10
      };

      const response = await axios.get('http://localhost:5000/api/disasters', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data) {
        let filteredReports = response.data;

        // Filter by type
        if (filters.type) {
          filteredReports = filteredReports.filter(report => 
            report.type.toLowerCase() === filters.type.toLowerCase()
          );
        }

        // Filter by severity
        if (filters.severity) {
          filteredReports = filteredReports.filter(report => 
            report.severity.toLowerCase() === filters.severity.toLowerCase()
          );
        }

        // Filter by date range
        if (filters.startDate || filters.endDate) {
          filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.createdAt).getTime();
            const startDate = filters.startDate ? new Date(filters.startDate).getTime() : 0;
            const endDate = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;
            return reportDate >= startDate && reportDate <= endDate;
          });
        }
        
        setReports(filteredReports);
        setTotalPages(Math.ceil(filteredReports.length / 10));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load disaster reports');
    } finally {
      setLoading(false);
    }
  };

  // Remove location input from JSX
  <div className="filter-section">
    <FaFilter /> Filters:
    <select name="type" value={filters.type} onChange={handleFilterChange}>
      <option value="">All Types</option>
      <option value="earthquake">Earthquake</option>
      <option value="flood">Flood</option>
      <option value="fire">Fire</option>
      <option value="cyclone">Cyclone</option>
      <option value="tsunami">Tsunami</option>
      <option value="tornado">Tornado</option>
      <option value="landslide">Landslide</option>
      <option value="industrial">Industrial Accident</option>
      <option value="other">Other</option>
    </select>

    <select name="severity" value={filters.severity} onChange={handleFilterChange}>
      <option value="">All Severities</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    </select>
    {/* Location input removed */}
  </div>

  useEffect(() => {
    fetchReports();
  }, [filters, sort, page]);

  return (
    <div className="disaster-feed">
      <div className="feed-header">
        <h1>Disaster Reports Feed</h1>
        <div className="feed-controls">
          <div className="filter-section">
            <FaFilter /> Filters:
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="earthquake">Earthquake</option>
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="cyclone">Cyclone</option>
              <option value="tsunami">Tsunami</option>
              <option value="tornado">Tornado</option>
              <option value="landslide">Landslide</option>
              <option value="industrial">Industrial Accident</option>
              <option value="other">Other</option>
            </select>

            <select name="severity" value={filters.severity} onChange={handleFilterChange}>
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="date-filter">
            <FaCalendar />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
            <span>to</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="sort-section">
            <FaSort /> Sort by:
            <select value={sort} onChange={handleSortChange}>
              <option value="-timestamp">Newest First</option>
              <option value="timestamp">Oldest First</option>
              <option value="-severity">Severity (High to Low)</option>
              <option value="severity">Severity (Low to High)</option>
            </select>
          </div>
        </div>
          {/* Location input completely removed */}
        </div>

      {loading && <div className="loading">Loading reports...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && reports.length === 0 && (
        <div className="no-reports">No reports found matching your criteria.</div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report._id} className={`report-card severity-${report.severity}`}>
              <div className="report-header">
                <h3>{report.type}</h3>
                <span className="report-date">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="report-content">
                <p className="report-description">{report.description}</p>
                
                <div className="report-details">
                  <div className="detail">
                    <span className="label">Severity:</span>
                    <span className={`severity-badge ${report.severity}`}>
                      {report.severity}
                    </span>
                  </div>
                  
                  <div className="detail">
                    <span className="label">People Affected:</span>
                    <span>{report.peopleAffected}</span>
                  </div>
                  
                  <div className="detail">
                    <span className="label">Infrastructure:</span>
                    <span>{report.infrastructure}</span>
                  </div>
                  
                  <div className="detail">
                    <span className="label">Location:</span>
                    <span>
                      {report.location.coordinates[1]}, {report.location.coordinates[0]}
                    </span>
                  </div>
                </div>

                {report.images && report.images.length > 0 && (
                  <div className="report-media">
                    <div className="images-grid">
                      {report.images.map((image, index) => {
                        console.log('Image path:', image); // Add this line
                        return (
                          <img 
                            key={index}
                            src={`http://localhost:5000/uploads/${image.split('/').pop()}`}
                            alt={`Disaster ${index + 1}`}
                            onError={(e) => {
                              console.error('Image load error:', image);
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                            }}
                            style={{
                              width: '300px',
                              height: '200px',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              borderRadius: '6px',
                              marginBottom: '1rem'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {report.videos && report.videos.length > 0 && (
                  <div className="report-media">
                    <div className="videos-grid">
                      {report.videos.map((video, index) => {
                        console.log('Video path:', video); // Add this line
                        return (
                          <video
                            key={index}
                            controls
                            width="100%"
                            style={{
                              maxWidth: '500px',
                              borderRadius: '6px',
                              marginBottom: '1rem',
                              backgroundColor: '#000'
                            }}
                          >
                            <source 
                              src={`http://localhost:5000/uploads/${video.split('/').pop()}`}
                              type="video/mp4" 
                            />
                            Your browser does not support the video tag.
                          </video>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default DisasterFeed;