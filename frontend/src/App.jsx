import { useState, useEffect } from 'react';

function App() {
  // --- AUTHENTICATION STATE ---
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [activeUser, setActiveUser] = useState(localStorage.getItem('username') || '');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'patients'

  // --- AI SCAN STATE ---
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // --- PATIENT STATE ---
  const [patients, setPatients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Select Gender', medical_history: '' });
  const [patientLoading, setPatientLoading] = useState(false);

  // Fetch patients automatically when the Patient tab is opened
  useEffect(() => {
    if (token && activeTab === 'patients') {
      fetchPatients();
    }
  }, [activeTab, token]);

  // ------------------------------------------------------------------------
  // PATIENT DIRECTORY LOGIC
  // ------------------------------------------------------------------------
  const fetchPatients = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) return handleLogout();
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients");
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (patientForm.gender === 'Select Gender') return alert("Please select a gender");
    
    setPatientLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/patients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(patientForm),
      });

      if (response.status === 401) return handleLogout();
      
      if (response.ok) {
        setShowAddForm(false);
        setPatientForm({ name: '', age: '', gender: 'Select Gender', medical_history: '' });
        fetchPatients(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to add patient");
    } finally {
      setPatientLoading(false);
    }
  };

  // ------------------------------------------------------------------------
  // AUTH LOGIC
  // ------------------------------------------------------------------------
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const endpoint = isLoginMode ? '/login' : '/register';
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Authentication failed");
      } else {
        if (isLoginMode) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          setToken(data.token);
          setActiveUser(data.username);
          setActiveTab('dashboard');
        } else {
          setIsLoginMode(true);
          setAuthForm({ username: '', password: '' });
          alert("Registration successful! Please log in.");
        }
      }
    } catch (err) {
      setAuthError("Failed to connect to the server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setActiveUser('');
    setResult(null);
    setFile(null);
    setPreview(null);
  };

  // ------------------------------------------------------------------------
  // AI DIAGNOSTIC LOGIC
  // ------------------------------------------------------------------------
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleAIAnalysis = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select an image first.");
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.status === 401) {
        handleLogout();
        alert("Session expired. Please log in again.");
        return;
      }
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      setError("Failed to connect to the AI server.");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (color) => {
    if (color === 'red') return 'bg-red-100 text-red-800 border-red-200';
    if (color === 'green') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (color === 'orange') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // =========================================================================
  // SCREEN 1: LOGIN UI
  // =========================================================================
  if (!token) {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <div className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-90 z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              <h1 className="text-3xl font-bold tracking-wider">AuraVis EHR</h1>
            </div>
            <h2 className="text-5xl font-extrabold leading-tight mb-6">Automated Glaucoma<br/>Screening Platform</h2>
            <p className="text-blue-200 text-lg max-w-md">Powered by PyTorch ResNet18. Secure, clinical-grade diagnostics engineered for scale.</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{isLoginMode ? "Provider Login" : "Register Provider"}</h2>
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Provider ID</label>
                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Secure Passcode</label>
                <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})}/>
              </div>
              {authError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4">{authLoading ? "Authenticating..." : (isLoginMode ? "Sign In" : "Create Account")}</button>
            </form>
            <p className="mt-8 text-center text-sm text-slate-500">
              <button onClick={() => {setIsLoginMode(!isLoginMode); setAuthError(null);}} className="text-blue-600 font-bold hover:underline">
                {isLoginMode ? "Register New Provider" : "Return to Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: MAIN APPLICATION DASHBOARD
  // =========================================================================
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 mb-4">
          <svg className="w-6 h-6 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          <span className="text-white font-bold text-lg tracking-wide">AuraVis EHR</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            AI Screening
          </button>
          <button 
            onClick={() => setActiveTab('patients')} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition ${activeTab === 'patients' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Patient Directory
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold">
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'dashboard' ? 'Diagnostic Overview' : 'Patient Management'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-500 mr-4">API Connected</span>
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              {activeUser.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-slate-700">{activeUser}</span>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          
          {/* VIEW 1: AI DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards (Same as before) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
                  <div className="p-4 bg-blue-50 rounded-lg text-blue-600 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Model Recall</p>
                    <p className="text-2xl font-bold text-slate-800">90.65%</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
                  <div className="p-4 bg-emerald-50 rounded-lg text-emerald-600 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Active Model</p>
                    <p className="text-2xl font-bold text-slate-800">ResNet18</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
                  <div className="p-4 bg-amber-50 rounded-lg text-amber-600 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Safety Threshold</p>
                    <p className="text-2xl font-bold text-slate-800">75.0%</p>
                  </div>
                </div>
              </div>

              {/* Upload Module */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">New Clinical Scan</h3>
                    <p className="text-sm text-slate-500">Upload a raw fundus image for immediate AI analysis.</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleAIAnalysis} className="space-y-6">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition relative overflow-hidden group">
                        {preview ? (
                          <>
                            <img src={preview} alt="Scan preview" className="absolute inset-0 w-full h-full object-contain p-4 z-0" />
                            <div className="absolute inset-0 bg-slate-900 bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-10">
                                <span className="bg-white text-slate-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg">Replace Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-slate-100 text-blue-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <p className="mb-2 text-sm text-slate-600"><span className="font-bold text-blue-600">Click to browse</span> or drag and drop</p>
                            <p className="text-xs text-slate-400 font-mono">JPG, PNG (Max 5MB)</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>

                    {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}

                    <div className="flex justify-end">
                      <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-md shadow-blue-200 flex items-center disabled:opacity-70">
                        {loading ? "Processing Geometry..." : "Run AI Analysis"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Results Module */}
              {result && !loading && (
                <div className={`mt-6 p-1 rounded-xl bg-gradient-to-r ${result.color === 'red' ? 'from-red-400 to-red-600' : result.color === 'green' ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'} shadow-lg`}>
                  <div className="bg-white rounded-lg p-8">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                      <div>
                        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Final Verdict</h4>
                        <h2 className="text-4xl font-extrabold text-slate-800">{result.verdict}</h2>
                      </div>
                      <div className="text-right">
                        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Confidence</h4>
                        <h2 className={`text-4xl font-extrabold ${result.color === 'red' ? 'text-red-600' : result.color === 'green' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {result.confidence}
                        </h2>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm font-mono text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <span>Telemetry: {result.details}</span>
                      <span>Authorized By: <span className="text-slate-800 font-bold">{result.analyzed_by}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW 2: PATIENT DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 p-6 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Enrolled Patients</h3>
                  <p className="text-sm text-slate-500">Manage patient records and medical histories.</p>
                </div>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-4 rounded-lg transition"
                >
                  {showAddForm ? 'Cancel' : '+ Add Patient'}
                </button>
              </div>

              {/* Add Patient Form */}
              {showAddForm && (
                <div className="p-6 border-b border-slate-200 bg-blue-50/50">
                  <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                      <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Age</label>
                        <input type="number" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                        <select className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white" value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})}>
                          <option disabled>Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Medical Notes (Optional)</label>
                      <textarea rows="2" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={patientForm.medical_history} onChange={e => setPatientForm({...patientForm, medical_history: e.target.value})}></textarea>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button type="submit" disabled={patientLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition">
                        {patientLoading ? 'Saving...' : 'Save Patient Record'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Patient List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Patient Name</th>
                      <th className="px-6 py-4 font-bold">Age</th>
                      <th className="px-6 py-4 font-bold">Gender</th>
                      <th className="px-6 py-4 font-bold">Date Enrolled</th>
                      <th className="px-6 py-4 font-bold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                          No patients found. Click "+ Add Patient" to start building your directory.
                        </td>
                      </tr>
                    ) : (
                      patients.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                          <td className="px-6 py-4">{p.age}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{p.gender}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{p.date_added}</td>
                          <td className="px-6 py-4 text-xs max-w-xs truncate" title={p.medical_history}>
                            {p.medical_history || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;