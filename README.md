# LuaProt Gateway - Complete Deployment Tutorial (Railway + Vercel)

A clean, monochromatic web application featuring:
- **Grid layout** with deep obsidian theme and black/white gradients.
- **Two bottom rounded tabs**:
  1. **Dashboard**: Login gate asking for **"enter your key:"** &rarr; once authenticated, unlocks:
     - **Script Loadstring** (with 1-click copy button)
     - **Reset HWID** (dedicated hardware reset action with live status)
     - **Key Info** (active status badge, expiration countdown, execution count, hardware lock, Discord tag)
     - **Hub Info** (Hub name, hub ID, permitted scripts list & versions)
     - **Log Out** button to return to the key gate.
  2. **Shop**: Prominent card with a **"Go to Shop"** button directly linking to [https://alternate.mykomerza.com/](https://alternate.mykomerza.com/).
- **Production Backend**: Configured for Railway hosting to securely keep your secret LuaProt API key protected from browser visitors.

---

## Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                      USER BROWSER                      │
 └───────────┬────────────────────────────────┬───────────┘
             │                                │
             ▼                                ▼
   ┌───────────────────┐            ┌───────────────────┐
   │  VERCEL FRONTEND  │            │  RAILWAY BACKEND  │
   │   HTML / CSS / JS │            │     server.js     │
   │                   │            │  (Express Node)   │
   └───────────────────┘            └─────────┬─────────┘
                                              │
                      Authorization: API_KEY  │  IP Whitelisted
                                              ▼
                                   ┌─────────────────────┐
                                   │  LUAPROT API ENGINE │
                                   │  https://luaprot.net│
                                   └─────────────────────┘
```

---

## Step-by-Step Tutorial: Deploying to Railway (Backend)

### Phase 1: Push Code to GitHub

1. If you haven't already, initialize git in this directory:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - LuaProt Gateway"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

### Phase 2: Create Service on Railway

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **"New Project"** &rarr; Select **"Deploy from GitHub repo"**.
3. Choose your repository.
4. Railway will automatically detect `server.js` and `package.json` and start building the container.

---

### Phase 3: Add Environment Variables in Railway

1. Click on your project/service in the Railway canvas.
2. Go to the **"Variables"** tab.
3. Click **"New Variable"** and add:

| Variable Name | Value Description | Example |
|---|---|---|
| `LUAPROT_API_KEY` | Your master account API key from [luaprot.com](https://luaprot.com/) | `lp_live_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `LUAPROT_HUB_ID` | Your Hub ID from your LuaProt Hubs dashboard | `40511091490620200512` |
| `CORS_ORIGIN` | Allowed origin for frontend requests | `*` |

> [!NOTE]
> You **do not** need to set `PORT`. Railway automatically sets and binds `PORT` internally.

---

### Phase 4: Generate Public Domain in Railway

1. In Railway, click on your service &rarr; go to the **"Settings"** tab.
2. Scroll down to **"Networking"** &rarr; **"Public Networking"**.
3. Click **"Generate Domain"**.
4. Railway will provide a public HTTPS URL (e.g. `https://pay4web-production.up.railway.app`).
5. Verify it's working by opening in your browser:
   ```
   https://your-backend.up.railway.app/health
   ```
   You should see:
   ```json
   {"status":"healthy","uptime":...,"hasApiKey":true,"hasHubId":true}
   ```

---

### Phase 5: Whitelist Railway IP on LuaProt

LuaProt blocks API requests from non-whitelisted IPs.

1. Log into your account at [https://luaprot.com/](https://luaprot.com/).
2. Navigate to your **Dashboard** / **API Settings** / **IP Whitelist**.
3. Add your Railway outbound IP:
   - In Railway, check your service metrics or outbound IP settings.
   - Alternatively, make a test request from Railway to an IP echo service like `https://api.ipify.org` if needed.
   - Enter that IP in the LuaProt whitelist box and click **Save**.

---

## Step-by-Step Tutorial: Deploying to Vercel (Frontend)

Now that your Railway backend is live and healthy, connect your frontend:

### Phase 1: Connect Frontend to your Railway Domain

1. Open `config.js` in your project folder.
2. Replace the empty string with your Railway domain URL:
   ```javascript
   window.API_BASE_URL = "https://your-backend.up.railway.app";
   ```
3. Commit and push this change to GitHub:
   ```bash
   git add config.js
   git commit -m "Configure Railway backend URL"
   git push
   ```

---

### Phase 2: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your GitHub repository.
4. Leave all build settings as default (Framework Preset: Other / Static).
5. Click **"Deploy"**.
6. Vercel will build your static site in ~10 seconds and give you a public URL (e.g. `https://your-project.vercel.app`).

---

## Testing Your Live Gateway

1. Open your Vercel URL in your browser.
2. Notice the two tabs at the bottom dock: **Dashboard** and **Shop**.
3. **Dashboard Tab**:
   - Displays the centered **"enter your key:"** input.
   - Enter any valid key from your LuaProt Hub and click **Authenticate Key**.
   - The dashboard unlocks instantly, showing:
     - Ready-to-copy **loadstring**: `loadstring(game:HttpGet("https://luaprot.net/api/v1/scripts/load?key=" .. YOUR_KEY))()`
     - **Reset HWID** button with instant feedback.
     - **Key Info** (expiration, executions, hardware lock status, Discord tag).
     - **Hub Info** (hub name, script names, script versions).
     - **Log Out** button to lock the dashboard again.
4. **Shop Tab**:
   - Click **Shop** in the bottom dock.
   - Click **"Go to Shop"** &mdash; opens [https://alternate.mykomerza.com/](https://alternate.mykomerza.com/) in a new tab.

---

## Local Development (Optional)

To test locally before deploying:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
