# Deployment Guide - DayOff Request Management System

Choose one of the free hosting platforms below and follow the steps.

---

## 🔥 **EASIEST OPTION: Render.com** (Recommended)

### Why Render?
- ✅ Free tier with 750 free hours/month
- ✅ Automatic GitHub deployment
- ✅ Free MongoDB database available
- ✅ No credit card required for basic tier
- ✅ Auto-deploys on Git push
- ✅ Great documentation

### Step 1: Create MongoDB Database (Free)

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"**
3. Create account (use same email as GitHub)
4. Create a new project: name it "dayoff"
5. Create a cluster: select "Free" tier
6. Wait for cluster to deploy (5-10 minutes)
7. Click **"Connect"** → **"Drivers"**
8. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dayoff?retryWrites=true&w=majority
   ```
9. **Save this string** - you'll need it for Render

### Step 2: Deploy to Render

1. Go to **https://render.com**
2. Click **"Sign up"** (use GitHub)
3. Authorize Render to access your GitHub
4. Click **"New+"** → **"Web Service"**
5. Select your **dayoff** repository
6. Fill in the details:
   - **Name**: `dayoff` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
7. Scroll to **"Environment"** section
8. Add these variables:
   ```
   MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/dayoff?retryWrites=true&w=majority
   SESSION_SECRET = your-secret-key-change-this-to-random-string
   NODE_ENV = production
   ```
9. Click **"Create Web Service"**
10. Wait 2-5 minutes for deployment
11. Your app will be live at: `https://dayoff.onrender.com`

**✨ That's it! Your app is deployed!**

---

## 🚂 **ALTERNATIVE: Railway.app**

### Why Railway?
- ✅ Very easy GitHub integration
- ✅ $5 free credits per month
- ✅ Great for side projects
- ✅ One-click deployment

### Step 1: Get MongoDB Connection

Same as Render above - get your MongoDB Atlas connection string.

### Step 2: Deploy to Railway

1. Go to **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway
4. Click **"Create a new Project"**
5. Select **"Deploy from GitHub repo"**
6. Choose your **dayoff** repository
7. Railway auto-detects Node.js environment
8. Click **"Add Variables"**
9. Add these environment variables:
   ```
   MONGO_URI = your-mongodb-atlas-url
   SESSION_SECRET = your-secret-key
   NODE_ENV = production
   ```
10. Click **"Deploy"**
11. Wait 1-3 minutes
12. Click on your service to get the public URL

**Your app is live!**

---

## ☁️ **ALTERNATIVE: Koyeb.com**

### Why Koyeb?
- ✅ Completely free tier
- ✅ GitHub integration
- ✅ Global CDN
- ✅ Generous free limits

### Step 1: MongoDB Setup

Get MongoDB Atlas URL (same as above)

### Step 2: Deploy

1. Go to **https://koyeb.com**
2. Sign up with GitHub
3. Click **"Create Service"**
4. Select **"GitHub"** → Choose **dayoff** repo
5. Configure:
   - **Runtime**: Node.js
   - **Build command**: `npm install`
   - **Run command**: `npm start`
6. Add environment variables:
   ```
   MONGO_URI = your-mongodb-url
   SESSION_SECRET = random-key
   NODE_ENV = production
   ```
7. Click **"Deploy"**
8. Get your URL from the dashboard

---

## 📊 **COMPARISON TABLE**

| Platform | Free Tier | Setup Time | Auto Deploy | Best For |
|----------|-----------|-----------|------------|----------|
| **Render** | 750 hrs/mo | 10 min | Yes ✅ | This project! |
| **Railway** | $5/month | 8 min | Yes ✅ | Light usage |
| **Koyeb** | Generous | 10 min | Yes ✅ | Always free |
| **Fly.io** | 3 shared-cpu | 15 min | Yes ✅ | Advanced |

---

## 🗄️ **MongoDB Setup (Required)**

### Option A: MongoDB Atlas (Recommended - Free Forever)

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Create account
3. Create a **Free** cluster
4. Get connection string
5. Keep it safe!

Connection string format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dayoff?retryWrites=true&w=majority
```

### Option B: MongoDB Realm (Advanced)

If you want to avoid MongoDB Atlas, you can use:
- **MongoDB Realm** (cloud Mongo from official source)
- Comes with 3 GB free storage
- Perfect for this app

---

## 🔧 **Post-Deployment Setup**

After your app is deployed and running:

### 1. Seed Initial Data

Go to your deployed URL and do this:
- Access the dashboard
- You can manually add users and departments
- Or send a request to seed endpoint (if you add one)

### 2. Create Admin User

After deployment:
1. Use the login page to check it works
2. Use the seed.js data if already seeded
3. Or manually create first manager user

### 3. Test the App

- Go to your live URL: `https://yourapp.onrender.com`
- Try to login (use seed users if seeded)
- Test creating working days
- Test day-off requests
- Test approval workflow

---

## 🔐 **Environment Variables You MUST Set**

These are **REQUIRED** in production:

```bash
# MongoDB connection (with real credentials)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dayoff

# Secret key for sessions (use a random string)
SESSION_SECRET=your-very-secure-random-key-here-min-32-chars

# Node environment
NODE_ENV=production
```

**Security Notes:**
- ❌ Never commit `.env` file to GitHub
- ✅ `.env.example` shows format (no secrets)
- ✅ Set real secrets in hosting platform dashboard
- ✅ Use strong random SESSION_SECRET

---

## 📱 **Test Your Deployment**

After deployment completes:

```bash
# Check logs
# In hosting platform dashboard → View logs

# Test endpoints
curl https://yourapp.onrender.com/login  # Should show login page
curl https://yourapp.onrender.com/       # Should redirect to login

# Test in browser
# Navigate to: https://yourapp.onrender.com
# Login page should appear
```

---

## 🆘 **Troubleshooting**

### "Application failed to start"
- Check logs in hosting dashboard
- Usually: MongoDB connection string is wrong
- Solution: Verify MONGO_URI environment variable

### "Cannot GET /"
- Server is running but no route handler
- Check that routes are properly configured
- Should redirect to /login

### "500 Internal Server Error"
- Check server logs
- Usually database connection issue
- Verify MongoDB is running
- Check MONGO_URI is correct

### App starts but times out
- Check MongoDB connection is working
- Verify firewall allows connection
- For MongoDB Atlas: Check IP whitelist (add 0.0.0.0/0)

### Session not persisting
- Make sure MONGO_URI points to valid database
- MongoStore needs write permissions
- Verify SESSION_SECRET is set

---

## 📊 **Cost Breakdown (Free Forever)**

- **Render Web Service**: Free (750 hrs/month)
- **MongoDB Atlas**: Free (512 MB storage, perfect for demo)
- **Domain**: Free (subdomain like app.onrender.com)
- **Total**: **$0/month** 🎉

If you need more storage/power later:
- Render: ~$7/month for upgrade
- MongoDB: ~$0.50/month for extra storage

---

## 🚀 **After Successful Deployment**

**Share your app:**
```
https://yourapp.onrender.com
```

**Demo link format:**
- If on Render: `https://dayoff.onrender.com`
- If on Railway: `https://dayoff-project-*.up.railway.app`
- If on Koyeb: `https://dayoff-*.koyeb.app`

---

## 📞 **Which Option Should You Choose?**

- **Want easiest setup?** → **Render** (Recommended)
- **Want most free credits?** → **Railway**
- **Want completely free forever?** → **Koyeb**
- **Want most features?** → **Render** + **MongoDB Atlas**

---

## ✅ **Deployment Checklist**

- [ ] .env.example created with format
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] Connection string saved
- [ ] Render/Railway/Koyeb account created
- [ ] Environment variables set in hosting
- [ ] App deployed and running
- [ ] Login page working
- [ ] Database connected
- [ ] Link shared

---

**Good luck with deployment! Your app will be live soon! 🚀**
