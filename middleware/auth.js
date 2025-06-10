// Authentication middleware for dashboard
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.redirect('/dashboard/login');
    }
}

// Check if user is already authenticated
function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        return res.redirect('/dashboard');
    } else {
        return next();
    }
}

// Check if session exists and is valid
function checkSession(req, res, next) {
    // Always require authentication for dashboard routes
    if (!req.session || !req.session.authenticated) {
        return res.redirect('/dashboard/login');
    }
    return next();
}

module.exports = {
    requireAuth,
    redirectIfAuthenticated,
    checkSession
};
