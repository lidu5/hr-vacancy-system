pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
        REMOTE_HOST = '10.10.20.167'
        REMOTE_USER = 'moa'
        APP_DIR = '/opt/hr_vacancy_system'
        SSH_CREDENTIALS_ID = 'hr-vacancy-ssh-key'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Validate Configuration') {
            steps {
                script {
                    echo 'Validating deployment configuration...'
                    sh '''
                        if [ ! -f docker-compose.yml ]; then
                            echo "Error: docker-compose.yml not found!"
                            exit 1
                        fi
                        if [ ! -f .env.production ]; then
                            echo "Error: .env.production not found!"
                            exit 1
                        fi
                        echo "Configuration files validated successfully"
                    '''
                }
            }
        }
        
        stage('Deploy to Remote Server') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    script {
                        echo "Deploying to ${REMOTE_HOST}..."
                        sh '''
                            # Create application directory on remote server
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${APP_DIR}"
                            
                            # Copy project files to remote server
                            echo "Copying files to remote server..."
                            rsync -avz --delete \
                                --exclude 'node_modules' \
                                --exclude 'venv' \
                                --exclude '.git' \
                                --exclude '__pycache__' \
                                --exclude '*.pyc' \
                                --exclude 'media' \
                                --exclude '.env' \
                                ./ ${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/
                            
                            echo "Files copied successfully"
                        '''
                    }
                }
            }
        }
        
        stage('Build and Start Containers') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    script {
                        echo "Building and starting Docker containers..."
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e
cd ${APP_DIR}

# Load environment variables
if [ -f .env.production ]; then
    export \$(cat .env.production | grep -v '^#' | xargs)
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Build images
echo "Building Docker images..."
docker-compose build --no-cache

# Start containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Check if containers are running
docker-compose ps
ENDSSH
                        '''
                    }
                }
            }
        }
        
        stage('Database Migration') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    script {
                        echo "Running database migrations..."
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ${APP_DIR}

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo "Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

echo "Database setup completed"
ENDSSH
                        '''
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "Performing health check..."
                    sh '''
                        # Wait for application to be fully ready
                        sleep 10
                        
                        # Check if application is responding
                        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${REMOTE_HOST}/ || echo "000")
                        
                        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
                            echo "Health check passed! HTTP Status: $HTTP_CODE"
                        else
                            echo "Health check failed! HTTP Status: $HTTP_CODE"
                            exit 1
                        fi
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    script {
                        echo "Verifying deployment..."
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ${APP_DIR}

echo "==================================="
echo "Deployment Verification"
echo "==================================="

# Show running containers
echo "Running containers:"
docker-compose ps

# Show container logs (last 20 lines)
echo ""
echo "Recent logs:"
docker-compose logs --tail=20

echo ""
echo "==================================="
echo "Deployment completed successfully!"
echo "==================================="
ENDSSH
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '========================================='
            echo 'Deployment completed successfully!'
            echo '========================================='
            echo "Application URL: http://${REMOTE_HOST}"
            echo "Admin Panel: http://${REMOTE_HOST}/admin"
            echo '========================================='
        }
        failure {
            echo '========================================='
            echo 'Deployment failed!'
            echo '========================================='
            sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                sh '''
                    echo "Fetching error logs from remote server..."
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ${APP_DIR}
echo "Container status:"
docker-compose ps
echo ""
echo "Error logs:"
docker-compose logs --tail=50
ENDSSH
                ''' || true
            }
        }
        always {
            echo 'Pipeline execution completed'
        }
    }
}
