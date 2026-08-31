# HR Vacancy System - Deployment Guide

## Overview
This guide covers deploying the HR Vacancy System to a remote server (196.191.93.56) using Docker, Nginx, and Jenkins.

## Architecture
- **Frontend**: React application (served via Nginx)
- **Backend**: Django REST API (served via Gunicorn)
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx
- **CI/CD**: Jenkins
- **Containerization**: Docker & Docker Compose

---

## Prerequisites

### On Remote Server (196.191.93.56)

1. **Install Docker**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

2. **Install Docker Compose**
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

3. **Install Nginx (Optional - for SSL/additional proxy)**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

4. **Jenkins Setup**

**Note**: You already have Jenkins running at:
- **URL**: http://jenkins.moa.gov.et
- **Server**: 10.10.20.126

For Jenkins configuration, see the detailed guide in `JENKINS_SETUP.md`

5. **Configure Firewall**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp  # Jenkins
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

---

## Deployment Steps

### Step 1: Prepare the Server

1. **Create application directory**
```bash
sudo mkdir -p /opt/hr_vacancy_system
sudo chown $USER:$USER /opt/hr_vacancy_system
cd /opt/hr_vacancy_system
```

2. **Clone or copy your project**
```bash
# Option 1: Using Git
git clone <your-repository-url> .

# Option 2: Using SCP from local machine
# Run this from your local machine:
scp -r "c:/Users/lydia/OneDrive/Desktop/Moa dev works/jop portal/job vaccancy/*" user@196.191.93.56:/opt/hr_vacancy_system/
```

### Step 2: Configure Environment Variables

1. **Edit .env.production file**
```bash
cd /opt/hr_vacancy_system
nano .env.production
```

2. **Update the following values**:
```env
DB_NAME=hr_vacancy_db
DB_USER=hr_user
DB_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD
SECRET_KEY=CHANGE_THIS_TO_RANDOM_SECRET_KEY
ALLOWED_HOSTS=196.191.93.56,localhost,127.0.0.1
DEBUG=False
```

3. **Generate a secure SECRET_KEY** (run on server):
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Step 3: Manual Deployment (Without Jenkins)

1. **Make deploy script executable**
```bash
chmod +x deploy.sh
```

2. **Run deployment**
```bash
./deploy.sh
```

3. **Create Django superuser**
```bash
docker-compose exec backend python manage.py createsuperuser
```

4. **Verify deployment**
```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Test application
curl http://196.191.93.56
```

### Step 4: Jenkins CI/CD Setup

**Your Existing Jenkins Server**:
- **URL**: http://jenkins.moa.gov.et
- **Server IP**: 10.10.20.126

**Complete Jenkins setup instructions are in `JENKINS_SETUP.md`**

**Quick Setup Summary**:

1. **Setup SSH from Jenkins (10.10.20.126) to Target Server (196.191.93.56)**
   ```bash
   # On Jenkins server
   sudo su - jenkins
   ssh-keygen -t rsa -b 4096
   cat ~/.ssh/id_rsa.pub
   # Copy this key to target server's authorized_keys
   ```

2. **Add SSH Credentials to Jenkins**
   - Go to: http://jenkins.moa.gov.et
   - Manage Jenkins → Manage Credentials
   - Add SSH private key with ID: `hr-vacancy-ssh-key`

3. **Create Pipeline Job**
   - New Item → Pipeline
   - Name: `HR-Vacancy-System-Deploy`
   - Use Jenkinsfile from your repository

4. **Run Deployment**
   - Click "Build Now"
   - Monitor progress

**See JENKINS_SETUP.md for detailed step-by-step instructions**

---

## Post-Deployment Configuration

### 1. Setup SSL/HTTPS (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Configure Nginx as Main Reverse Proxy

Create `/etc/nginx/sites-available/hr-vacancy`:
```nginx
server {
    listen 80;
    server_name 196.191.93.56;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hr-vacancy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup Monitoring

```bash
# View logs
docker-compose logs -f

# Monitor resource usage
docker stats

# Check container health
docker-compose ps
```

---

## Maintenance Commands

### Start/Stop Application
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations
```bash
# Backup database
docker-compose exec db pg_dump -U hr_user hr_vacancy_db > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T db psql -U hr_user hr_vacancy_db < backup_20240831.sql

# Access database
docker-compose exec db psql -U hr_user -d hr_vacancy_db
```

### Django Management
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Django shell
docker-compose exec backend python manage.py shell
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify environment variables
docker-compose exec backend env | grep DB_
```

### Permission issues
```bash
# Fix media/static permissions
sudo chown -R 1000:1000 Backend/hr_vacancy_system/media
sudo chown -R 1000:1000 Backend/hr_vacancy_system/staticfiles
```

### Port already in use
```bash
# Find process using port 80
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>
```

---

## Security Checklist

- [ ] Change default passwords in .env.production
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS properly
- [ ] Setup firewall (UFW)
- [ ] Enable SSL/HTTPS
- [ ] Regular backups configured
- [ ] Update SECRET_KEY to random value
- [ ] Secure Jenkins with strong password
- [ ] Disable root SSH login
- [ ] Setup fail2ban for SSH protection

---

## Access Points

After successful deployment:

- **Frontend Application**: http://196.191.93.56
- **Django Admin**: http://196.191.93.56/admin
- **API Endpoints**: http://196.191.93.56/api/
- **Jenkins**: http://196.191.93.56:8080

---

## Support

For issues or questions, check:
1. Application logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. System resources: `docker stats`
4. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
