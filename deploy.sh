#!/bin/bash

# HR Vacancy System Deployment Script
# Usage: ./deploy.sh

set -e

echo "========================================="
echo "HR Vacancy System Deployment"
echo "========================================="

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production file not found!"
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Build and start containers
echo "Building Docker images..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo "Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

# Create superuser (optional - comment out if not needed)
# echo "Creating superuser..."
# docker-compose exec -T backend python manage.py createsuperuser --noinput || true

# Show running containers
echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
docker-compose ps

echo ""
echo "Application is running at: http://196.191.93.56"
echo "Admin panel: http://196.191.93.56/admin"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
