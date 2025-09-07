import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';

// Pages
import StudentList from './pages/StudentList';
import StudentForm from './pages/StudentForm';
import ProgressList from './pages/ProgressList';
import ProgressForm from './pages/ProgressForm';
import ProgressEdit from './pages/ProgressEdit';
import WeeklySummary from './pages/WeeklySummary';
import MonthlySummary from './pages/MonthlySummary';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            {/* Default redirect to students */}
            <Route path="/" element={<Navigate to="/students" replace />} />
            
            {/* Student routes */}
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/new" element={<StudentForm />} />
            <Route path="/students/:id/edit" element={<StudentForm />} />
            
            {/* Progress routes */}
            <Route path="/progress" element={<ProgressList />} />
            <Route path="/progress/new" element={<ProgressForm />} />
            <Route path="/progress/:studentId" element={<ProgressList />} />
            <Route path="/progress/:id/edit" element={<ProgressEdit />} />
            
            {/* Summary routes */}
            <Route path="/summaries/weekly/:studentId" element={<WeeklySummary />} />
            <Route path="/summaries/monthly/:studentId" element={<MonthlySummary />} />
            
            {/* Reports routes */}
            <Route path="/reports/:studentId" element={<Reports />} />
          </Routes>
        </div>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;