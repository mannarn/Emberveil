# 🚀 DEPLOYMENT CHECKLIST FOR EMBERVEIL

## ✅ What's Ready to Deploy

Your frontend is now configured for GitHub Pages deployment:

- ✓ Static HTML/CSS/JS files in `/FrontEnd/`
- ✓ GitHub Pages workflow created (`.github/workflows/gh-pages.yml`)
- ✓ Auto-environment detection (local → localhost, production → Render)
- ✓ `.nojekyll` file to skip Jekyll processing

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### Step 1: Verify Relay Server URL

Before deploying, ensure your relay server is running on **Render**:

- **Current setting**: `https://emberveil-relay.onrender.com`
- **Update if different**: Edit `FrontEnd/authenticationUI.html` line ~272

```javascript
// If your relay is at a different URL, update:
const RELAY = 'https://YOUR-RELAY-URL.onrender.com';
```

### Step 2: Test Locally (Optional)

```bash
# Terminal
cd FrontEnd
python -m http.server 8000

# Browser: http://localhost:8000/authenticationUI.html
# Try signing up/in to ensure relay connection works
```

### Step 3: Push to GitHub

```bash
git add -A
git commit -m "feat: deploy frontend to GitHub Pages"
git push origin main
```

### Step 4: Enable GitHub Pages

1. Go to your GitHub repo
2. Click **Settings** → scroll to **Pages**
3. Under "Build and deployment":
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / folder: `/FrontEnd`
   - Click **Save**

4. Wait for deployment (usually <1 minute)
5. Check the deploy status in **Actions** tab

### Step 5: Access Your Frontend

Your site will be live at:

```
https://<your-username>.github.io/Emberveil/
```

Browse to:
- **Sign In**: `https://<your-username>.github.io/Emberveil/authenticationUI.html`
- **Home**: `https://<your-username>.github.io/Emberveil/homeUI.html`

---

## 🔍 VERIFY DEPLOYMENT

### Check Console (F12)

Open your deployed site and press **F12** → **Console**. You should see:

```
✓ ethers.js
✓ TweetNaCl
✓ Web Crypto API
```

If any are ✗, there's a library loading issue.

### Test Authentication

1. Click **Create Account**
2. Try signing up with a test username
3. Check browser console for any errors
4. Verify relay connection succeeded

### Check Relay Logs

```bash
# On your Render dashboard:
1. Go to your emberveil-relay service
2. Click "Logs" tab
3. Look for successful registration entries
4. Example: "✓ Registered alice → tx 0x..."
```

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] Relay server running on Render (`https://emberveil-relay.onrender.com`)
- [ ] RELAY URL correct in `authenticationUI.html` (line ~272)
- [ ] Changes committed and pushed to `main` branch
- [ ] GitHub Pages enabled in Settings
- [ ] Source set to `main` branch, `/FrontEnd` folder
- [ ] GitHub Actions deployment successful (check Actions tab)
- [ ] Frontend accessible at `https://<username>.github.io/Emberveil/`
- [ ] No console errors (F12 → Console)
- [ ] Test sign-up works (connects to relay successfully)

---

## 🆘 TROUBLESHOOTING

### ❌ "Relay not reachable" error

**Fix:** Update RELAY URL in `authenticationUI.html`:

```javascript
// Line ~272 - ensure this matches your deployed relay
const RELAY = 'https://emberveil-relay.onrender.com';
```

Then push changes:
```bash
git add FrontEnd/authenticationUI.html
git commit -m "fix: update relay URL"
git push
```

### ❌ GitHub Pages not deploying

1. Check `.github/workflows/gh-pages.yml` exists
2. Go to Settings → Pages → ensure "Deploy from branch" is selected
3. Check **Actions** tab for workflow errors
4. Try running workflow manually:
   - Actions → Deploy Frontend → Run workflow → main

### ❌ "Module not found" in console

**CDN libraries failing to load.** Check:
- Internet connection
- Browser console for 404 errors
- CDN status: https://status.jsdelivr.com/

### ❌ CORS errors

**Fix:** Ensure relay has CORS enabled:

```bash
# On your relay (emberveil-relay/src/middleware.js):
# Should have: app.use(cors());
```

---

## 📊 DEPLOYMENT STATUS

| Component | Status | URL |
|-----------|--------|-----|
| **Frontend** | 🟢 Ready | `https://<username>.github.io/Emberveil/` |
| **Relay** | 🟢 Render | `https://emberveil-relay.onrender.com` |
| **Smart Contract** | 🟢 Polygon Amoy | `0x614A4148d1BeD71b3634Fa18b7f0D4CFD491322A` |

---

## 🎓 NEXT STEPS

1. **Share with team**
   - Frontend URL available for testing
   - All credentials tested

2. **Monitor in production**
   - Check Render logs for auth transactions
   - Monitor GitHub Pages for errors

3. **Prepare for YC Demo**
   - Test full signup/login flow
   - Ensure relay is responsive
   - Screenshot working login page

---

## 📞 Quick Reference

```bash
# Push changes
git add FrontEnd/
git commit -m "deploy: frontend updates"
git push origin main

# Check deployment status
# → Go to: https://github.com/yourusername/Emberveil/actions

# View live site
# → https://<yourusername>.github.io/Emberveil/authenticationUI.html

# View relay logs (Render)
# → Go to your Render service dashboard → Logs tab
```

---

**Deployment initiated**: ✓  
**Auto-deployed to**: https://github.com/yourusername/Emberveil  
**Next deploy**: Push to `main` branch triggers automatic deployment  
**Status**: Check Actions tab for latest deployment status

---

Need help? Check [docs/deployment.md](./deployment.md) for detailed guide.
