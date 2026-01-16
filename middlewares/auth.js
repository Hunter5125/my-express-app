// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Middleware to require manager or admin role
function requireManager(req, res, next) {
  if (!req.session.user || (req.session.user.role !== 'manager' && req.session.user.role !== 'admin')) {
    return res.status(403).send('Access denied');
  }
  next();
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied');
  }
  next();
}

module.exports = {
  requireLogin,
  requireManager,
  requireAdmin
};
