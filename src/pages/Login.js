import React, {useEffect} from 'react'
import {useNavigate} from 'react-router-dom'

import '../css/loginStyles.css'
import '../css/styles.css'

import Emergency from '../smaller_components/Emergency.js'
import AuthApp from '../authentification/app.js'

//this is the page with the login logic
function Login() {
    const navigate = useNavigate();

    useEffect(() =>{
      //const App = window.App;
        if(AuthApp){
            AuthApp.getElements();
            AuthApp.setupEventListeners();
            
            AuthApp.navigate = navigate;
            AuthApp.updateAuthUI();
        }
    }, [navigate]);

    return <>
    <div className="gradient-bg full-height">
    <main className="container center-content" style={{flex: 1, justifyContent: "center"}}>
    
    <div className="login-card fade-in">
      <h1 className="text-center text-white mb-lg">Welcome to BrightBridge!</h1>

      <div className="container">
        <header>
          <div id="auth-controls"></div>
        </header>

        <main>
          <div id="auth-view" className="view">
            <button id="login-btn" className="btn btn-primary">Log In / Sign Up</button>
          </div>
        </main>
      </div>
      
      <div className="login-options mt-md">
        <p className="text-center text-white" style={{fontSize: 'var(--font-size-xs)'}}>
          Don't have an account? Your first login will create one.
        </p>
      </div>
      
    </div>
    
  </main>
  
  <Emergency/>
  </div>
    </>
}

export default Login