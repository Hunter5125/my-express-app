require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');

var authRouter = require('./routes/auth');
var usersRouter = require('./routes/users');
var requestsRouter = require('./routes/requests');
var departmentsRouter = require('./routes/departments');
var sectionsRouter = require('./routes/sections');
var settingsRouter = require('./routes/settings');

var mongoose = require('mongoose');

// suppress deprecation warnings for older mongoose versions
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// use env var or default to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://yousef321Fadlallah:OO2Rgxn4n510zwXG@cluster0.d2qjcav.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB:', mongoUri))
  .catch(err => console.error('MongoDB connection error:', err));

var session = require('express-session');
var MongoStore = require('connect-mongo');

var app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('view options', { layout: 'layouts/main' });

// configure hbs partials
const hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// register helpers
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});
hbs.registerHelper('ne', function(a, b) {
  return a !== b;
});
hbs.registerHelper('lowercase', function(str) {
  return str ? str.toString().toLowerCase() : '';
});
hbs.registerHelper('substring', function(str, start, end) {
  if (!str) return '';
  return str.toString().substring(start, end);
});
hbs.registerHelper('and', function(a, b) {
  return a && b;
});
hbs.registerHelper('or', function(a, b) {
  return a || b;
});
hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});
hbs.registerHelper('formatDate', function(date, format) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    // If format is 'iso', return YYYY-MM-DD
    if (format === 'iso') {
      return d.toISOString().split('T')[0];
    }
    
    // Default: return locale date string
    return d.toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
});

// Helper to safely render signature image HTML
hbs.registerHelper('signatureImg', function(signature) {
  if (!signature) return new hbs.SafeString('');
  // Create the img tag with proper escaping
  const escaped = signature.toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = `<img src="${escaped}" alt="Signature" style="max-width: 95%; max-height: 90px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`;
  return new hbs.SafeString(html);
});

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/requests', requestsRouter);
app.use('/users', usersRouter);
app.use('/departments', departmentsRouter);
app.use('/sections', sectionsRouter);
app.use('/settings', settingsRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Log the error details for debugging
  console.error('=== ERROR DETAILS ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('=== END ERROR ===');
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
