import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

// --- Authentication Page Component ---
const AuthPage = ({ setToken, setUser }) => {
    const [view, setView] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const endpoint = view === 'login' ? '/api/login' : '/api/signup';
        try {
            const res = await axios.post(`https://resumeragbackend.onrender.com${endpoint}`, { email, password });
            const { token, user } = res.data;
            setToken(token);
            setUser(user);
            localStorage.setItem('authToken', token);
            localStorage.setItem('authUser', JSON.stringify(user));
        } catch (error) {
            console.error("Authentication Error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
            } else if (error.request) {
                setMessage('Network Error: Could not connect to the backend server.');
            } else {
                setMessage('An error occurred. Please check the console for details.');
            }
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>{view === 'login' ? 'Welcome Back!' : 'Create an Account'}</h1>
                <p>{view === 'login' ? 'Sign in to continue to ResumeRAG' : 'Get started by creating your account'}</p>
                {message && <p className="auth-message">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="auth-input" placeholder="you@example.com" />
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="auth-input" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="auth-button">{view === 'login' ? 'Login' : 'Sign Up'}</button>
                </form>
                <p className="auth-switch-text">
                    {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
                        {view === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- Main Application View Component ---
const AppView = ({ user, token, handleLogout }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [searchHistory, setSearchHistory] = useState([]);
    const [hasUploaded, setHasUploaded] = useState(false);
  
    const API_CONFIG = { headers: { Authorization: `Bearer ${token}` } };
    const UPLOAD_URL = 'https://resumeragbackend.onrender.com/api/upload';
    const SEARCH_URL = 'https://resumeragbackend.onrender.com/api/search';
  
    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  
    const handleUpload = async () => {
        if (!selectedFile) return;
        setSearchHistory([]);
        setIsUploading(true);
        setMessage({ text: '', type: 'info' });
        const formData = new FormData();
        formData.append('resume', selectedFile);
        try {
            const res = await axios.post(UPLOAD_URL, formData, API_CONFIG);
            setMessage({ text: res.data.message, type: 'success' });
            setHasUploaded(true);
        } catch (error) {
            console.error("Upload Error:", error);
            setMessage({ text: error.response?.data?.error || 'Upload failed.', type: 'error' });
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
            if (document.getElementById('file-input')) document.getElementById('file-input').value = null;
        }
    };
    
    const handleSearch = async (e) => {
        if(e) e.preventDefault();
        
        if (!hasUploaded) {
            setMessage({ text: 'Please upload a resume before searching.', type: 'error' });
            return;
        }
        
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setMessage({ text: '', type: 'info' });
        try {
            const res = await axios.post(SEARCH_URL, { query: searchQuery }, API_CONFIG);
            // Storing the clean query
            const newSearch = { query: searchQuery, results: res.data };
            setSearchHistory([newSearch]);
            if(res.data.length === 0){
              setMessage({text: `No results found for "${searchQuery}"`, type: 'info'})
            }
        } catch (error) {
            console.error("Search Error:", error);
            setMessage({ text: error.response?.data?.error || 'Search failed.', type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };
  
    const anyLoading = isUploading || isSearching;

    const SimilarityBar = ({ score }) => (
        <div className="similarity-bar-container">
            <p>{(score * 100).toFixed(2)}% Match</p>
            <div className="similarity-bar-bg">
                <div className="similarity-bar-fg" style={{ width: `${score * 100}%` }}></div>
            </div>
        </div>
    );
    
    const SkillTags = ({ skills = [] }) => (
        <div className="skills-container">
            {skills.slice(0, 7).map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
            ))}
        </div>
    );

    return (
        <div className="container">
            <header>
                <h1>ResumeRAG</h1>
                <p>An intelligent recruitment tool that understands context, not just keywords, to find the perfect candidate.</p>
            </header>
            <nav className="navbar">
                <div className="navbar-brand">Your Dashboard</div>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </nav>
  
            {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
            
            <div className="workflow-container">
                <div className="stepper-line"></div>
                <div className="card">
                    <div className="card-header">
                        <div className="step-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                        </div>
                        <h2>Step 1: Upload a Resume</h2>
                    </div>
                    <input id="file-input" type="file" accept=".pdf" onChange={handleFileChange} />
                    <div className="button-container">
                        <button onClick={handleUpload} disabled={anyLoading || !selectedFile}>Upload Resume</button>
                        {isUploading && <div className="loader"></div>}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="step-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        </div>
                        <h2>Step 2: Keyword Search</h2>
                    </div>
                    <form className="search-form" onSubmit={handleSearch}>
                        <input type="text" className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g., Python developer" />
                        <button type="submit" className="search-button" disabled={anyLoading || !searchQuery.trim()}>
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <div className="results">
              {searchHistory.length > 0 && searchHistory.map((search, index) => (
                  <div key={index} className="search-session">
                      {search.results.length > 0 && search.results.map(result => (
                          <div key={result.id} className="result-item">
                              <div className="result-header">
                                  <h3>{result.filename}</h3>
                                  <SimilarityBar score={result.similarity} />
                              </div>
                              <div className="snippet">
                                {/* --- THE FIX IS HERE --- */}
                                <p className="snippet-title">AI Insight for: <span>"{search.query}"</span></p>
                                <p className="snippet-text">{result.snippet}</p>
                              </div>
                              <SkillTags skills={result.skills} />
                          </div>
                      ))}
                  </div>
              ))}
            </div>
        </div>
    );
};

// --- Root App Component ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('authUser')));

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  return (
    <>
      {token && user ? (
        <AppView key={user.id} user={user} token={token} handleLogout={handleLogout} />
      ) : (
        <AuthPage setToken={setToken} setUser={setUser} />
      )}
    </>
  );
}

export default App;

