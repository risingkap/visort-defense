import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './Pages/LoginPage/LoginPage';
import Sidebar from './components/Sidebar/Sidebar';  
import LogoHeader from './components/LogoHeader/LogoHeader'; 
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import NotificationPage from './Pages/NotificationModule/NotificationPage';
import DisposalHistoryLog from './Pages/DisposalHistoryLog/DisposalHistory';
import HazardousWasteBin from './Pages/HazardousWaste/HazardousWasteBin';
import NonHazardousWasteBin from './Pages/NonHazardousWaste/NonHazardousWasteBin';
import WasteLogManagement from './Pages/WasteLogManagement/WasteLogManagement';
import ComplianceReportModule from './Pages/ComplianceReportModule/ComplianceReportModule';
import CreateAccount from './Pages/AccountManagement/CreateAccount';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Always start as not logged in - require actual login
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Force users to login fresh each time - clear any existing auth
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    sessionStorage.clear();
    setIsLoggedIn(false);
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Dashboard Layout Component with logout handler
  const DashboardLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
      // Clear all authentication data
      localStorage.removeItem("authToken");
      localStorage.removeItem("isLoggedIn");
      sessionStorage.clear();
      
      // Update the login state and navigate to login
      setIsLoggedIn(false);
      navigate("/login");
    };

    return (
      <div className="flex min-h-screen">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          onLogout={handleLogout}
        />
        <div className={`flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'ml-24' : 'ml-80'}`}>
          <LogoHeader isCollapsed={isCollapsed} />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/disposal-history" element={<DisposalHistoryLog />} />
              <Route path="/hazardous-waste-bin" element={<HazardousWasteBin />} />
              <Route path="/non-hazardous-waste-bin" element={<NonHazardousWasteBin />} />
              <Route path="/compliance-reports" element={<ComplianceReportModule/>}/>
              <Route path="/waste-log" element={<WasteLogManagement/>} /> 
              <Route path="/account-management" element={<CreateAccount />} />
              <Route path="/" element={<Navigate to="/disposal-history" replace />} />
            </Routes>
          </main>
        </div>
      </div>  
    );  
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && (
        <Router>
          <Routes>
            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                isLoggedIn ? (
                  <Navigate to="/disposal-history" replace />
                ) : (
                  <LoginPage 
                    setIsLoggedIn={(value) => {
                      setIsLoggedIn(value);
                      localStorage.setItem('isLoggedIn', String(value));
                    }} 
                  />
                )
              } 
            />
            
            {/* Protected Dashboard Routes */}
            <Route 
              path="/*" 
              element={
                isLoggedIn ? (
                  <DashboardLayout />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Root redirect */}
            <Route 
              path="/" 
              element={
                <Navigate to={isLoggedIn ? "/disposal-history" : "/login"} replace />
              } 
            />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;