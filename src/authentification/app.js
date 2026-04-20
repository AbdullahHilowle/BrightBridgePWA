import Auth from '/js/auth.js'

// Main app module - handles UI and orchestrates auth and data modules
const App = {
    navigate : null,

    elements: {},
    
    init() {
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
        }
    },
    
    setupEventListeners() {

        if(this.elements.loginBtn)
            this.elements.loginBtn.onclick = () => {
                Auth.login();
            };
        
        if(this.elements.logoutBtn)
            this.elements.logoutBtn.onclick = () => {
                Auth.logout();
            };

        if(this.elements.userDisplay)
            this.elements.userDisplay.textContent = Auth.getUsername() || "Guest";
        
    },
    
    updateAuthUI() {

        const path = window.location.pathname;

        console.log('swtiching the user to another page')
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

            if(path === '/login'){
                this.navigate?.('/login');
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
        if(path === '/login' || path ==='/') {
            const isReturningUser = localStorage.getItem('brightbridge_returning_user') === 'true';
            const destination = isReturningUser
                ? '/home'
                : '/home-first-time.html';
            if (!isReturningUser) {
                localStorage.setItem('brightbridge_returning_user', 'true');
            }
            this.navigate?.(destination);
        }

}
};

// Expose App globally so Auth can call updateAuthUI
window.App = App;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

export default App