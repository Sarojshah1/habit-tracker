# Free Deployment Guide for HabitTrack

This guide walks you through deploying **HabitTrack** for **100% free** using **MongoDB Atlas** (Free M0 Cluster) and **Vercel** (Hobby Plan).

---

## 🏗️ Architecture for Free Deployment

| Service | Tier | Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | M0 Free Shared Cluster | **$0 / Free Forever** | Hosted database (512MB storage, SSL replica set) |
| **Vercel** | Hobby Plan | **$0 / Free Forever** | Full-stack Next.js hosting, Serverless APIs, Global CDN, Automated HTTPS |
| **GitHub** | Free Account | **$0 / Free Forever** | Code hosting and automatic continuous deployments |

---

## Step 1: Set Up Free MongoDB Atlas Database (5 Minutes)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and register for a free account.
2. In the setup wizard, select the **"M0 Free"** Shared Cluster (choose AWS or Google Cloud in the region closest to you).
3. **Create Database Credentials**:
   - Go to **Security** → **Database Access** → Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Set a username (e.g. `habittrack_admin`) and a secure password.
   - Built-in Role: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network Access**:
   - Go to **Security** → **Network Access** → Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *Why?* This allows Vercel's serverless functions to connect securely to your database.
   - Click **Confirm**.
5. **Copy Your Connection String**:
   - Go to **Deployments** → **Database** → Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the URI string, which looks like:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/habittrack?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the credentials you created in step 3. Ensure the database name is set to `/habittrack` before the `?`.

---

## Step 2: Push Code to GitHub

1. Open [github.com/new](https://github.com/new) in your browser.
2. Create a new repository named `habittrack`.
   - Set it to **Public** or **Private** (both work on Vercel).
   - Do **NOT** check "Initialize with README" (we already have a complete repo with `.gitignore`).
3. Run the following commands in your terminal:
   ```bash
   cd /Users/sarojkumarsah/Downloads/habittrack

   # Link your GitHub repository (replace with your actual GitHub username)
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/habittrack.git

   # Push the code
   git push -u origin main
   ```

---

## Step 3: Deploy to Vercel (2 Minutes)

1. Go to [vercel.com](https://vercel.com) and click **Sign Up** (Sign in with your GitHub account).
2. On your Vercel Dashboard, click **"Add New..."** → **"Project"**.
3. Locate `habittrack` in the list of GitHub repositories and click **Import**.
4. Configure Project:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (default)
5. **Add Environment Variables**:
   In the **Environment Variables** section, add the following 3 variables:

   | Variable Name | Value | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/habittrack?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `AUTH_SECRET` | `5f1024e7eddbb3547d98432e8931937087f5cdf7a2234a29ecc96bc111e88f32` | 32+ character random secret for JWT signing |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project-name.vercel.app` (or leave empty initially) | Your production URL |

6. Click **Deploy**.
7. In about 45–60 seconds, Vercel will build and assign you a live production URL (e.g. `https://habittrack-abc.vercel.app`).

---

## Step 4: Seed Demo Data into Your Live Database (Optional)

If you would like your live deployment to immediately have the realistic student account (`student@example.com` / `password123`) with 30 days of streaks and habits:

Run this command once from your local machine, inserting your MongoDB Atlas URI:

```bash
cd /Users/sarojkumarsah/Downloads/habittrack

MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/habittrack?retryWrites=true&w=majority" npm run seed
```

This will connect to your live Atlas cluster and populate:
- `student@example.com` / `password123`
- 5 core habits (Study, Read, Exercise, Drink water, Meditate)
- 30 days of completion logs (active 12-day streak)
- Goals, focus sessions, and productivity notes

---

## 🔄 Automatic Continuous Deployment (CI/CD)

Whenever you make future code changes, simply run:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Vercel will automatically build and deploy the update in under a minute with zero downtime!
