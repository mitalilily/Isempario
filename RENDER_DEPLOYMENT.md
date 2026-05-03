# Render Deployment Fix

If Render shows this error:

```txt
Publish directory npm start does not exist!
```

the project was created as a **Static Site** or the Render settings were filled into the wrong fields.

Isempario is a MERN app. It must be deployed as a **Web Service**, not a Static Site.

## Correct Render Service Type

Use:

```txt
New + -> Web Service
```

Do not use:

```txt
Static Site
```

## Correct Render Settings

```txt
Environment: Node
Branch: main
Root Directory: leave blank
Build Command: npm ci && npm run build
Start Command: npm start
```

There should be no Publish Directory field for a Web Service.

If Render is asking for a Publish Directory, you are in the wrong service type.

## Environment Variables

```env
MONGO_URI=mongodb://mongo:QQcaKIfzUeZDJPMyZtByPtlRCatLBLTd@tramway.proxy.rlwy.net:48093
JWT_SECRET=use-a-long-random-production-secret
CLIENT_URL=https://your-render-app-url
NODE_VERSION=20
```

Replace `CLIENT_URL` with your actual Render URL after deployment.

## Why This Works

`npm run build` creates:

```txt
dist/index.html
dist/assets/*
```

`npm start` runs:

```txt
node server/index.js
```

The Express server then serves:

- React frontend from `dist`
- Backend API from `/api`

