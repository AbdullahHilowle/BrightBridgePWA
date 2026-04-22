import Auth from './auth.js'

// Main app module - handles UI and orchestrates auth and data modules
const AuthApp = {
    elements: {},
    isLoggedIn: false,
    
    // Boot the app by initializing auth, caching key DOM nodes, and wiring listeners.
    init() {
        if (typeof window !== 'undefined') {
        // Initialize with explicit settings
        window.netlifyIdentity.init({
            container: 'body', // Explicitly tell it where to inject
        });
    }

        Auth.init()
    },

    getElements(){
        try{
            this.elements = {
                loginBtn: document.getElementById('login-btn'),
                logoutBtn: document.getElementById('logout-btn'),
                userDisplay: document.getElementById('user-display'),
            };
        }catch(e){
            alert('error: '+e)
        }},
    
    // Attach click handlers and initialize visible user name where elements exist.
    setupEventListeners() {

        if(this.elements.loginBtn)
            this.elements.loginBtn.addEventListener('click', () => {
                Auth.login();
            });
        
        if(this.elements.logoutBtn)
            this.elements.logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });

        if(this.elements.userDisplay)
            this.elements.userDisplay.textContent = Auth.getUsername() || "Guest";
        
    },
    
    // Route users to the correct page whenever auth state changes.
    updateAuthUI() {
        console.log('switching the user to another page')
        var savedUser = localStorage.getItem('brightbridge.user');
        var user;

        try {
            user = savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            user = null; // Guard against malformed JSON
        }

        // IF THE USER IS NULL:
        if (!user) {
            // Only redirect if we are NOT already on the login page{

            if(!window.location.pathname.includes('/login')){
                window.location.assign('/login');
                console.log('redirecting to login page');
                return;
            }
                
            console.log('the user doesnt exist but is on the login page');
            return; // Stay here, do nothing else.
        }

        console.log('the user exists');
        // IF THE USER EXISTS and is on login/index, redirect appropriately:
        // First-time users go to home-first-time for onboarding.
        // Returning users go straight to the standard dashboard.
        if(window.location.pathname.includes('/login')) {
            const isReturningUser = localStorage.getItem('brightbridge_returning_user') === 'true';
            const destination = isReturningUser
                ? '/home'
                : '/home-first-time';
            if (!isReturningUser) {
                localStorage.setItem('brightbridge_returning_user', 'true');
            }
            window.location.assign(destination);
        }

}
};

// Expose App globally so Auth can call updateAuthUI
window.App = AuthApp;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthApp.init());
} else {
    AuthApp.init();
}

export default AuthApp