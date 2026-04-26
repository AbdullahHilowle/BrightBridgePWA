// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
/* global netlifyIdentity */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {

        // 1. Initialize once
        if (!window.netlifyIdentity._initialized) {
            netlifyIdentity.init();
            window.netlifyIdentity._initialized = true;
        }

        // 2. Sync initial user (from localStorage/cookie)
        const currentUser = window.netlifyIdentity.currentUser();
        setUser(currentUser);
        setIsInitialized(true);

        // 3. LISTENERS: These update the state automatically
        window.netlifyIdentity.on('login', (loggedUser) => {
            setUser(loggedUser); // This triggers UI updates everywhere!
            localStorage.setItem('brightbridge.user', JSON.stringify(loggedUser));
            window.netlifyIdentity.close();
        });

        window.netlifyIdentity.on('logout', () => {
            setUser(null);
            localStorage.removeItem('brightbridge.user');
            window.location.reload();
        });

    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
};