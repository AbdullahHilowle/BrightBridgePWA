import React from 'react'
import {useNavigate} from 'react-router-dom'

import Emergency from '../smaller_components/Emergency'

import '../css/dailycheckin.css'
import '../css/styles.css'



function DailyCheckin(){

    const navigate = useNavigate();

    return<>
    <div class="full-height">

    <header class="app-header gradient-header">
        <div class="container">
        <div class="header-content">
            <button class="back-button" onClick={navigate('/home')} aria-label="Go to home page">
            ← Home
            </button>
            <h1 class="text-white">Daily Check-In</h1>
        </div>
        </div>
    </header>

    <main class="container" style={{flex: 1, paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)'}}>

        <section class="card fade-in">
        <h2 style={{fontSize: 'var(--font-size-md)', marginBottom: 'var(--spacing-sm)'}}>Choose an option</h2>
        <p style={{color: 'var(--dark-gray)', marginBottom: 'var(--spacing-md)'}}>
            Start a new daily entry or review your recent journal history.
        </p>

        <button onClick={navigate('/home-first-time')} class="btn btn-primary btn-large" style={{width: '100%', marginBottom: 'var(--spacing-sm)'}}>
            Open/Edit Today's Entry
        </button>
        </section>

        <section id="historyCard" class="card history-shell" aria-live="polite">
        <h2 class="history-title">Last 10 Journal Entries</h2>
        <div id="historyList"></div>
        </section>

    </main>

    {<Emergency/>}

    <button onClick={navigate("/help")} class="help-fab pulse" aria-label="Get help now">
        <span style={{fontWeight: 700, fontSize: '18px'}}>HELP</span>
    </button>

  </div>
    
    </>
}

export default DailyCheckin