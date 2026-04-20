import React,{useState} from 'react'
import './css/styles.css';
import AuthContext from './helper/AuthContext.js'
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom'

import Greeting from './pages/Greeting.js'
import Login from './pages/Login.js'

function App() {

  const[authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
  });

  return (
    <div className="App">
      <AuthContext.Provider value = {{authState, setAuthState}}>
      <Router>
       
        <div className = "navBox">
      
        </div>

        <Routes>
          <Route path = "/" element = {<Greeting/>}/>
          <Route path = '/login' element = {<Login/>}/>
          
        </Routes>
      </Router>

      </AuthContext.Provider>
      
    </div>
  );
}

export default App;
