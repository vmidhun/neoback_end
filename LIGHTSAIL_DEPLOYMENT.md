# Deploying to AWS Lightsail

This guide will help you move your Express + Vite application from Vercel to an AWS Lightsail instance.

## 1. Create a Lightsail Instance
1. Log in to your [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **Lightsail**.
3. Click **Create instance**.
4. Choose **Linux/Unix** and selecting **Ubuntu 22.04 LTS** (or 24.04).
5. Choose your instance plan (Micro or Small is usually enough).
6. Give it a name and click **Create instance**.

## 2. Server Setup
Once your instance is running, connect via SSH (using the browser terminal or your own terminal) and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

## 3. Deployment Steps
On your local machine, ensure you have built the frontend:

```bash
npm run build
```

Then, upload your code to the server (you can use Git, SCP, or ZIP). If using Git:

```bash
# On the server
git clone <your-repo-url>
cd <repo-name>
npm install --production
```

## 4. Environment Variables
Create a `.env` file on the server in the root of your project:

```bash
nano .env
```
Copy and paste your environment variables (MONGODB_URI, JWT_SECRET, etc.).

## 5. Launch with PM2
Launch the application using the provided ecosystem config:

```bash
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup
```

## 6. Networking (Firewall)
In the Lightsail console, go to the **Networking** tab for your instance:
1. Add a firewall rule for **HTTP (Port 80)** if it's not already there.
2. (Optional) Add **HTTPS (Port 443)** for SSL.

## 7. Setup Nginx Reverse Proxy
Since you have other applications running, you'll need to configure Nginx to route traffic to this app (running internally on port 3003).

### Create Nginx Config
Create a new configuration file (replace `yourdomain.com` with your actual domain or IP):

```bash
sudo nano /etc/nginx/sites-available/neo-backend
```

### Add the Configuration
Paste the following:

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3003; # Internal port from ecosystem.config.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for AI processing if needed
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

### Enable and Reload
```bash
sudo ln -s /etc/nginx/sites-available/neo-backend /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl reload nginx
```

## 8. Final Launch
Now start the app with PM2 (it doesn't need sudo now since it's on port 3003):

```bash
pm2 start ecosystem.config.js
pm2 save
```
