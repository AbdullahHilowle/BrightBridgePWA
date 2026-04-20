import React from 'react'
import '/css/styles.css';
import AuthContext from '/helper/AuthContext.js'
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom'

import Greeting from '/src/Greetings.js'
import Login from '/src/Login.js'

function App() {
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
