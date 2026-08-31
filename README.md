# HR Vacancy System

A comprehensive HR vacancy management system built with Django REST Framework (Backend) and React (Frontend).

## Features

- 📝 Job vacancy posting and management
- 👥 Candidate application tracking
- 🔐 User authentication and authorization
- 📊 Dashboard with analytics
- 📄 Resume/CV upload and management
- 🔍 Advanced filtering and search
- 📧 Email notifications

## Tech Stack

### Backend
- Django 6.1
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Gunicorn

### Frontend
- React 19
- React Router
- Axios
- Bootstrap 5
- React Bootstrap

### DevOps
- Docker & Docker Compose
- Nginx
- Jenkins CI/CD

## Project Structure

```
├── Backend/
│   └── hr_vacancy_system/
│       ├── accounts/          # User management
│       ├── candidates/        # Candidate applications
│       ├── vacancies/         # Job vacancy management
│       ├── hr_vacancy_system/ # Project settings
│       └── manage.py
├── Frontend/
│   └── frontend/
│       ├── public/
│       └── src/
│           ├── components/    # React components
│           ├── services/      # API services
│           └── App.js
├── docker-compose.yml
├── Jenkinsfile
└── DEPLOYMENT.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd job-vaccancy
```

2. **Backend Setup**
```bash
cd Backend/hr_vacancy_system
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

3. **Frontend Setup**
```bash
cd Frontend/frontend
npm install
npm start
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Docker Deployment

```bash
# Copy and configure environment variables
cp .env.production .env
# Edit .env with production values

# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions using Docker, Nginx, and Jenkins.

See [JENKINS_SETUP.md](JENKINS_SETUP.md) for Jenkins CI/CD configuration.

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token

### Vacancies
- `GET /api/vacancies/` - List all vacancies
- `POST /api/vacancies/` - Create vacancy (admin)
- `GET /api/vacancies/{id}/` - Get vacancy details
- `PUT /api/vacancies/{id}/` - Update vacancy (admin)
- `DELETE /api/vacancies/{id}/` - Delete vacancy (admin)

### Candidates
- `GET /api/candidates/` - List candidates (admin)
- `POST /api/candidates/` - Submit application
- `GET /api/candidates/{id}/` - Get candidate details

## Environment Variables

Create a `.env` file in the Backend/hr_vacancy_system directory:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DB_NAME=hr_vacancy_db
DB_USER=hr_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.

## Authors

- Ministry of Agriculture (MOA) Development Team

## Acknowledgments

- Django REST Framework
- React Team
- Bootstrap Team
