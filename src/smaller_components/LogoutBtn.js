import React from 'react'

import Auth from '../authentification/auth.js'

function LogoutBtn(){

    const logout = Auth.logout();

    return<><button id="logout-btn" type="button" onClick={logout}>Log Out</button></>
}

export default LogoutBtn