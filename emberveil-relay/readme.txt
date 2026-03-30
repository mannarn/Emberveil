Step 1 — Install Fly CLI
Run in PowerShell:
powershellpowershell -ExecutionPolicy Bypass -Command "iwr https://fly.io/install.ps1 -useb | iex"
Then close and reopen PowerShell.

Step 2 — Sign up & Login
powershellfly auth signup
# or if you already have an account:
fly auth login
```
This opens a browser. Sign in with GitHub for easiest setup.

---

## Step 3 — Add the two new files to your project

Put `Dockerfile` and `fly.toml` in the same folder as your `server.js`. Your folder should look like:
```
emberveil-relay/
  server.js
  package.json
  Dockerfile        ← new
  fly.toml          ← new
  .gitignore
  .env.example

Step 4 — Launch (first time only)
powershellcd path\to\emberveil-relay
fly launch --no-deploy
When it asks:

App name → type emberveil-relay (or any name you like)
Existing fly.toml detected, use it? → Yes
Set up a Postgresql database? → No
Set up an Upstash Redis? → No


Step 5 — Set your secrets (env vars)
powershellfly secrets set RELAY_PRIVATE_KEY="0xyour_private_key_here"
fly secrets set JWT_SECRET="paste_your_long_random_string_here"
fly secrets set CONTRACT_ADDRESS="0x28757AD7b10440627fA7798B6589C73f133F9020"
Generate JWT_SECRET right now:
powershellnode -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Step 6 — Deploy
powershellfly deploy
```

Watch the logs build in real time. Should take ~2 minutes. At the end you'll see:
```
✓ Machine started in Xms

Step 7 — Test it
powershellfly open /api/health
# or
curl https://emberveil-relay.fly.dev/api/health
Should return:
json{ "status": "ok", "ready": true, "network": "Polygon Amoy" }
```

---

## Step 8 — Point your Cloudflare domain

Once it's live, update your Cloudflare CNAME:
```
apiinit-emberveil.dev → emberveil-relay.fly.dev

Key things I set in fly.toml:

Region sin (Singapore) — lowest latency from Chennai
auto_stop_machines = false — keeps it always on (critical so your in-memory nonce store never resets mid-login)
min_machines_running = 1 — guarantees one instance is always alive
256MB RAM — plenty for Express + ethers.js