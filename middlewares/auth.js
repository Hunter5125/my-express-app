// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Middleware to require manager role
function requireManager(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'manager') {
    return res.status(403).send('Access denied');
  }
  next();
}

module.exports = {
  requireLogin,
  requireManager
};
