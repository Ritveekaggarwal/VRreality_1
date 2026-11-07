# Deploying VReality for free

Vercel hosts the site. Render hosts the API and the AI service. MongoDB Atlas holds the
data. Follow the steps in order.

## 1. Rotate exposed secrets

`backend/.env` holds old keys in comments. Replace each one that is still live, then
delete those comment lines:

- MongoDB database user passwords (Atlas > Database Access)
- Tavus API key
- HeyGen, Runway and D-ID keys, or revoke them if you no longer use those services

## 2. Commit and push

Render and Vercel deploy from GitHub, so push this code first.

## 3. Set up email (Brevo)

Render's free plan blocks SMTP, and the old Gmail token has expired, so email codes go
through Brevo's HTTPS API. The free plan needs no custom domain.

1. Create an account at brevo.com.
2. Under Senders, add your email address and verify it.
3. Under SMTP & API > API Keys, create a key.

Keep the key and the verified address for step 5.

## 4. Open MongoDB Atlas to Render

Render's free plan has no fixed IP address. In Atlas, go to Network Access > Add IP
Address > Allow Access From Anywhere (`0.0.0.0/0`). This makes a strong database
password essential, which step 1 covers.

## 5. Deploy the backend on Render

1. Render dashboard > New > Blueprint, then choose this repository.
2. It reads `render.yaml` and asks for these values:

| Variable | Value |
| --- | --- |
| `GROQ_API_KEY` | From `ai/.env` |
| `MONGO_URI` | Your Atlas connection string |
| `GOOGLE_AUTH_CLIENT_ID` | From `backend/.env` |
| `EMAIL_FROM` | The address you verified in Brevo |
| `BREVO_API_KEY` | From step 3 |
| `TAVUS_API_KEY`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID` | From `backend/.env` |

3. Check the service addresses. If they aren't exactly `vreality-api.onrender.com` and
   `vreality-ai.onrender.com`, update `AI_SERVER_URL` on Render and the destination in
   `frontend/capstone/vercel.json`, then push.
4. Open `https://vreality-api.onrender.com/api/health`. It should show `{"status":"ok"}`.

## 6. Deploy the site on Vercel

1. New Project, then import this repository.
2. Set **Root Directory** to `frontend/capstone`.
3. Add the environment variable `VITE_GOOGLE_CLIENT_ID`, using the same value as
   `GOOGLE_AUTH_CLIENT_ID`.
4. Deploy, and note your address, such as `https://vreality.vercel.app`.

## 7. Allow your site in Google

Google Cloud Console > APIs & Services > Credentials > your OAuth client. Under
**Authorized JavaScript origins**, add both of these:

- `https://your-site.vercel.app`
- `http://localhost:5173`

Changes can take a few minutes to apply.

## 8. Check it

- Sign up with email and receive a code.
- Sign in with Google.
- Refresh the page and confirm you stay signed in.
- Open a lesson, then scan the QR code with your phone on mobile data.

## Good to know

- **Free services sleep after about 15 minutes idle.** The first visit afterwards takes
  around a minute. The site starts waking the services as soon as the home page opens.
- **Free instance hours are shared** between both services. Sleeping services don't use
  them, so normal use fits. An always-on setup needs a paid plan.
- **Scaling up:** rate limits and the lesson-start guard live in memory, which suits one
  instance. Move them to Redis before running more than one API instance.
