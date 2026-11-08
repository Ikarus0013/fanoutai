import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('analyze');

  const isUrl = (text) => {
    const urlPattern = /^https?:\/\//;
    return urlPattern.test(text.trim());
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setError('');
    setSuccess('');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter a prompt or URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5001/api/analyze', {
        input: input.trim()
      });

      setResult(response.data);
      
             if (response.data.type === 'url_analysis') {
               setSuccess(`Generated ${response.data.generated_prompts.length} prompts from the website!`);
             } else {
               setSuccess(`Found ${response.data.queries.length} real GPT-5 search queries!`);
             }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred while analyzing';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSelect = (prompt) => {
    setInput(prompt);
    setResult(null);
    setError('');
    setSuccess('');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const copyAllQueries = () => {
    if (result && result.queries) {
      const allQueries = result.queries.join('\n');
      copyToClipboard(allQueries);
    }
  };

  const getButtonText = () => {
    if (loading) {
      return 'Analyzing...';
    }
    if (isUrl(input)) {
      return 'Generate Prompts';
    }
    return 'Analyze Prompt';
  };

     const getPlaceholder = () => {
       if (isUrl(input)) {
         return 'Enter a website URL to generate SEO prompts...';
       }
       return 'Enter a prompt to extract real GPT-5 search queries...';
     };

  return (
    <div className="app">
      {/* Top Header Bar */}
      <div className="top-header">
        <div className="header-left">
          <div className="header-logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span>AI SEO Blueprint</span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search AI SEO Blueprint" className="search-input" />
          </div>
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div className="profile-avatar">
              <div className="avatar-circle">AB</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-layout">
        {/* Left Sidebar */}
        <div className="sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Prompt Analysis</span>
            </button>
            
            <button className={`nav-item ${activeTab === 'url' ? 'active' : ''}`} onClick={() => setActiveTab('url')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>URL Analysis</span>
            </button>
            
            <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v5h5"/>
                <path d="M21 21v-5h-5"/>
                <path d="M21 3l-7 7-4-4"/>
                <path d="M3 21l7-7 4 4"/>
              </svg>
              <span>History</span>
            </button>
            
            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>API Connected</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          <div className="content-header">
            <h1>
              {activeTab === 'analyze' && 'Prompt Analysis'}
              {activeTab === 'url' && 'URL Analysis'}
              {activeTab === 'history' && 'Analysis History'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
                   <p className="header-description">
                     {activeTab === 'analyze' && 'Extract the real search queries that GPT-5 uses when answering your prompts'}
                     {activeTab === 'url' && 'Generate SEO-optimized prompts from any website content'}
                     {activeTab === 'history' && 'View your previous analyses and saved queries'}
                     {activeTab === 'settings' && 'Configure your API keys and preferences'}
                   </p>
          </div>

          <div className="content-section">
            {(activeTab === 'analyze' || activeTab === 'url') && (
              <>
                <div className="input-section">
                  <div className="input-container">
                    <input
                      type="text"
                      className="input-field"
                      placeholder={getPlaceholder()}
                      value={input}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  
                  <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="loading">
                        <div className="spinner"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      getButtonText()
                    )}
                  </button>
                </div>

                {error && (
                  <div className="alert error">
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert success">
                    <span>{success}</span>
                  </div>
                )}

                {result && (
                  <div className="results-container">
                    {result.type === 'url_analysis' && (
                      <div className="platforms-grid">
                        {result.generated_prompts.map((prompt, index) => (
                          <div
                            key={index}
                            className="platform-card"
                            onClick={() => handlePromptSelect(prompt)}
                          >
                            <div className="platform-icon">{index + 1}</div>
                            <div className="platform-name">{prompt}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.queries && (
                      <div className="queries-section">
                               <div className="queries-header">
                                 <h3>Real GPT-5 Search Queries</h3>
                                 <button className="copy-all-button" onClick={copyAllQueries}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy All
                          </button>
                        </div>
                        
                        <div className="queries-list">
                          {result.queries.map((query, index) => (
                            <div key={index} className="query-item">
                              <span className="query-text">{query}</span>
                              <button className="copy-button" onClick={() => copyToClipboard(query)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <div className="placeholder-content">
                <h3>Analysis History</h3>
                <p>Your previous analyses will appear here</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-content">
                <h3>API Configuration</h3>
                <div className="setting-item">
                  <label>OpenAI API Key</label>
                  <input type="password" placeholder="sk-..." />
                  <small>Your API key is stored locally and never shared</small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Stats */}
        <div className="right-sidebar">
          <div className="stats-card">
            <div className="stats-header">
              <h3>Analysis Stats</h3>
            </div>
            
            <div className="stats-content">
              <div className="stat-item">
                <div className="stat-value">{result ? (result.queries ? result.queries.length : result.generated_prompts ? result.generated_prompts.length : 0) : 0}</div>
                <div className="stat-label">
                  {result && result.type === 'url_analysis' ? 'Generated Prompts' : 'Search Queries'}
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">GPT-5</div>
                <div className="stat-label">AI Model Used</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">API Connected</div>
                <div className="stat-label">Status</div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h4>Quick Actions</h4>
              <button className="action-button" onClick={() => setActiveTab('analyze')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                Analyze Prompt
              </button>
              <button className="action-button" onClick={() => setActiveTab('url')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                URL Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
