# Jenkins Setup Guide for HR Vacancy System

## Overview
This guide covers setting up the HR Vacancy System deployment pipeline on your existing Jenkins server.

**Jenkins Server**: jenkins.moa.gov.et (10.10.20.126)  
**Target Deployment Server**: 196.191.93.56  
**Application**: HR Vacancy System (Django + React)

---

## Prerequisites on Jenkins Server (10.10.20.126)

### 1. Required Jenkins Plugins

Login to Jenkins at `http://jenkins.moa.gov.et/` and install these plugins:

1. **Manage Jenkins** → **Manage Plugins** → **Available**
2. Install the following plugins:
   - **SSH Agent Plugin** (for SSH authentication)
   - **Git Plugin** (for source code management)
   - **Pipeline Plugin** (for pipeline support)
   - **Docker Pipeline Plugin** (optional, if building on Jenkins)
   - **Credentials Binding Plugin**

### 2. Install Required Tools on Jenkins Server

SSH into Jenkins server (10.10.20.126) and install:

```bash
# Install rsync (for file transfer)
sudo apt update
sudo apt install rsync -y

# Verify installation
rsync --version
```

---

## Step 1: Setup SSH Access from Jenkins to Target Server

### On Jenkins Server (10.10.20.126)

1. **Generate SSH key for Jenkins user**:
```bash
# Switch to jenkins user
sudo su - jenkins

# Generate SSH key (press Enter for all prompts)
ssh-keygen -t rsa -b 4096 -C "jenkins@moa.gov.et"

# Display public key
cat ~/.ssh/id_rsa.pub
```

2. **Copy the public key output** (starts with `ssh-rsa...`)

### On Target Server (196.191.93.56)

1. **SSH into target server**:
```bash
ssh root@196.191.93.56
```

2. **Add Jenkins public key to authorized_keys**:
```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add Jenkins public key
echo "PASTE_JENKINS_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

3. **Test SSH connection from Jenkins server**:
```bash
# On Jenkins server (as jenkins user)
ssh -o StrictHostKeyChecking=no root@196.191.93.56 "echo 'SSH connection successful'"
```

---

## Step 2: Add SSH Credentials to Jenkins

1. **Login to Jenkins**: http://jenkins.moa.gov.et/

2. **Navigate to Credentials**:
   - Click **Manage Jenkins**
   - Click **Manage Credentials**
   - Click **(global)** domain
   - Click **Add Credentials**

3. **Add SSH Private Key**:
   - **Kind**: SSH Username with private key
   - **ID**: `hr-vacancy-ssh-key` (must match Jenkinsfile)
   - **Description**: HR Vacancy System SSH Key
   - **Username**: `root`
   - **Private Key**: Select "Enter directly"
   - Click **Add** and paste the private key from Jenkins server:
     ```bash
     # On Jenkins server, get private key
     sudo cat /var/lib/jenkins/.ssh/id_rsa
     ```
   - Click **OK**

---

## Step 3: Setup Git Repository Access

### Option A: Public Repository
If your code is in a public Git repository, no additional setup needed.

### Option B: Private Repository

1. **Add Git Credentials to Jenkins**:
   - **Manage Jenkins** → **Manage Credentials** → **Add Credentials**
   - **Kind**: Username with password (for HTTPS) or SSH Username with private key (for SSH)
   - **ID**: `hr-vacancy-git-credentials`
   - **Username**: Your Git username
   - **Password**: Your Git password or personal access token
   - Click **OK**

### Option C: Manual Code Upload
If not using Git, you can manually upload code to Jenkins server:

```bash
# On Jenkins server
sudo mkdir -p /var/lib/jenkins/workspace/hr-vacancy-system
sudo chown jenkins:jenkins /var/lib/jenkins/workspace/hr-vacancy-system

# Copy code to Jenkins server (from your local machine)
scp -r "c:/Users/lydia/OneDrive/Desktop/Moa dev works/jop portal/job vaccancy/*" \
    user@10.10.20.126:/var/lib/jenkins/workspace/hr-vacancy-system/
```

---

## Step 4: Create Jenkins Pipeline Job

1. **Create New Job**:
   - Click **New Item**
   - Enter name: `HR-Vacancy-System-Deploy`
   - Select **Pipeline**
   - Click **OK**

2. **Configure General Settings**:
   - **Description**: Automated deployment pipeline for HR Vacancy System
   - Check **Discard old builds** (keep last 10 builds)

3. **Configure Build Triggers** (Optional):
   - Check **Poll SCM** for automatic builds
   - Schedule: `H/15 * * * *` (check every 15 minutes)
   - Or check **GitHub hook trigger** if using GitHub webhooks

4. **Configure Pipeline**:

   **Option A: Pipeline from SCM (Recommended)**
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your Git repository URL
   - **Credentials**: Select your Git credentials (if private repo)
   - **Branch**: `*/main` or `*/master`
   - **Script Path**: `Jenkinsfile`
   - Click **Save**

   **Option B: Pipeline Script (Direct)**
   - **Definition**: Pipeline script
   - Copy and paste the entire content from `Jenkinsfile`
   - Click **Save**

---

## Step 5: Prepare Target Server (196.191.93.56)

Before running the pipeline, ensure the target server is ready:

```bash
# SSH into target server
ssh root@196.191.93.56

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Create application directory
mkdir -p /opt/hr_vacancy_system
```

---

## Step 6: Configure Environment Variables

1. **Create .env.production on target server**:
```bash
# On target server (196.191.93.56)
cd /opt/hr_vacancy_system
nano .env.production
```

2. **Add the following content**:
```env
# Database Configuration
DB_NAME=hr_vacancy_db
DB_USER=hr_user
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_HOST=db
DB_PORT=5432

# Django Configuration
DEBUG=False
SECRET_KEY=YOUR_DJANGO_SECRET_KEY_HERE
ALLOWED_HOSTS=196.191.93.56,localhost,127.0.0.1

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_password
```

3. **Generate secure SECRET_KEY**:
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

4. **Set proper permissions**:
```bash
chmod 600 .env.production
```

---

## Step 7: Run the Pipeline

1. **Go to your Jenkins job**: http://jenkins.moa.gov.et/job/HR-Vacancy-System-Deploy/

2. **Click "Build Now"**

3. **Monitor the build**:
   - Click on the build number (e.g., #1)
   - Click **Console Output** to see real-time logs

4. **Pipeline Stages**:
   - ✅ Checkout - Gets code from repository
   - ✅ Validate Configuration - Checks required files
   - ✅ Deploy to Remote Server - Copies files via rsync
   - ✅ Build and Start Containers - Builds Docker images
   - ✅ Database Migration - Runs Django migrations
   - ✅ Health Check - Verifies application is running
   - ✅ Verify Deployment - Shows deployment status

---

## Step 8: Verify Deployment

After successful pipeline execution:

1. **Check Application**:
   - Frontend: http://196.191.93.56
   - Admin Panel: http://196.191.93.56/admin

2. **SSH to target server and verify**:
```bash
ssh root@196.191.93.56
cd /opt/hr_vacancy_system

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check container health
docker stats
```

3. **Create Django superuser** (first time only):
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## Troubleshooting

### Issue: SSH Connection Failed

**Solution**:
```bash
# On Jenkins server, test SSH manually
sudo su - jenkins
ssh -v root@196.191.93.56

# Check SSH key permissions
ls -la ~/.ssh/
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### Issue: rsync Command Not Found

**Solution**:
```bash
# On Jenkins server
sudo apt update
sudo apt install rsync -y
```

### Issue: Permission Denied on Target Server

**Solution**:
```bash
# On target server
sudo chown -R root:root /opt/hr_vacancy_system
sudo chmod -R 755 /opt/hr_vacancy_system
```

### Issue: Docker Compose Build Failed

**Solution**:
```bash
# On target server, check logs
cd /opt/hr_vacancy_system
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database Connection Error

**Solution**:
```bash
# Check .env.production file exists and has correct values
cat /opt/hr_vacancy_system/.env.production

# Check database container is running
docker-compose ps db
docker-compose logs db

# Restart database
docker-compose restart db
```

### Issue: Jenkins Build Hangs

**Solution**:
- Check Jenkins server resources (CPU, memory)
- Increase timeout in Jenkinsfile
- Check network connectivity between Jenkins and target server

---

## Pipeline Configuration Variables

You can customize these in the Jenkinsfile:

```groovy
environment {
    REMOTE_HOST = '196.191.93.56'           // Target server IP
    REMOTE_USER = 'root'                     // SSH user
    APP_DIR = '/opt/hr_vacancy_system'       // Application directory
    SSH_CREDENTIALS_ID = 'hr-vacancy-ssh-key' // Jenkins credential ID
}
```

---

## Automated Deployments

### Trigger on Git Push (Webhook)

1. **In your Git repository settings**:
   - Add webhook URL: `http://jenkins.moa.gov.et/github-webhook/` (for GitHub)
   - Or: `http://jenkins.moa.gov.et/git/notifyCommit?url=<your-repo-url>` (for generic Git)

2. **In Jenkins job configuration**:
   - Check **GitHub hook trigger for GITScm polling**
   - Or check **Poll SCM** with schedule

### Manual Deployment

1. Go to: http://jenkins.moa.gov.et/job/HR-Vacancy-System-Deploy/
2. Click **Build Now**
3. Monitor progress in Console Output

---

## Maintenance Commands

### View Jenkins Logs
```bash
# On Jenkins server
sudo tail -f /var/log/jenkins/jenkins.log
```

### Restart Jenkins
```bash
# On Jenkins server
sudo systemctl restart jenkins
```

### Clean Jenkins Workspace
```bash
# On Jenkins server
sudo rm -rf /var/lib/jenkins/workspace/HR-Vacancy-System-Deploy/*
```

---

## Security Best Practices

1. ✅ Use SSH keys instead of passwords
2. ✅ Store sensitive data in Jenkins credentials
3. ✅ Use .env.production for environment variables
4. ✅ Never commit .env files to Git
5. ✅ Regularly update Docker images
6. ✅ Enable Jenkins security and authentication
7. ✅ Use HTTPS for Jenkins (configure SSL)
8. ✅ Limit SSH access to specific IPs
9. ✅ Regular backups of database and media files

---

## Backup Strategy

### Database Backup (Automated)

Add to Jenkins pipeline or create separate job:

```bash
# Backup script
ssh root@196.191.93.56 << 'EOF'
cd /opt/hr_vacancy_system
BACKUP_DIR=/opt/backups/hr_vacancy
mkdir -p $BACKUP_DIR
docker-compose exec -T db pg_dump -U hr_user hr_vacancy_db > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF
```

---

## Support and Monitoring

### Application URLs
- **Frontend**: http://196.191.93.56
- **Admin Panel**: http://196.191.93.56/admin
- **Jenkins**: http://jenkins.moa.gov.et

### Monitoring Commands
```bash
# On target server
cd /opt/hr_vacancy_system

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Check resource usage
docker stats

# Check disk space
df -h
```

---

## Next Steps

1. ✅ Complete Jenkins setup following this guide
2. ✅ Test SSH connection from Jenkins to target server
3. ✅ Create Jenkins pipeline job
4. ✅ Run first deployment
5. ✅ Create Django superuser
6. ✅ Setup automated backups
7. ✅ Configure monitoring/alerting
8. ✅ Setup SSL certificate (optional)

---

## Contact

For issues or questions:
- Check Jenkins Console Output for detailed error messages
- Review Docker logs on target server
- Verify SSH connectivity and credentials
