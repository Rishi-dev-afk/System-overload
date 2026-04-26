# ⚡ System Overload

A production-ready MVP for gamified computer science learning platform with AI-powered adaptive difficulty, boss battles, and comprehensive progress tracking.

## 🎯 Features

### Core Learning Loop
- **Subject → Topic → Level progression** with interactive explanations
- **AI evaluation** + feedback for free-text answers
- **Adaptive difficulty** based on performance metrics
- **XP rewards** + level unlocking system

### Gamification System
- **XP & leveling** (per subject + global rank)
- **Boss battles** after each module (timed, no hints)
- **Quests** (daily/weekly goals)
- **Power-ups** (hints, time freeze, XP boosts)

### Weakness Tracking
- **Performance analytics** (accuracy, time, retries)
- **Weak topic identification** with auto-resurface
- **Personalized practice recommendations**

### AI-Powered Engine
- **Multi-level explanations** (simple → technical → analogy)
- **Dynamic question generation** for unlimited practice
- **Context-aware hints** and feedback
- **Natural language evaluation** for coding problems

### Subject-Specific Gameplay
- **Algorithms**: strategy-based problem solving + visualizations
- **Operating Systems**: scheduling, memory, deadlock simulations
- **Cloud Computing**: architecture decision scenarios
- **Discrete Math**: proofs, graph puzzles, recurrence solving
- **DBMS**: ER modeling, SQL challenges, optimization

### Dashboard & Analytics
- **Progress tracking** (XP, weak areas, streaks)
- **Exam readiness score** with predictive analytics
- **"Last 24 Hours Mode"** with compressed revision + mock battles

## 🏗️ Tech Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Primary database
- **Redis** - Caching + game state + Celery broker
- **Celery** - Background task processing

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

### AI Layer
- **OpenRouter API** - LLM integration
- **Prompt engineering** for explanations, evaluation, question generation

### Visualization
- **D3.js** - Custom charts and graphs
- **Chart.js** - Standard visualizations
- **Canvas/WebGL** - Simulations and interactive diagrams

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

### Backend Setup

1. **Clone and navigate:**
   ```bash
   git clone <repository-url>
   cd system-overload/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

### Docker Setup (Alternative)

```bash
# From project root
docker-compose up --build
```

## 📁 Project Structure

```
system-overload/
├── backend/
│   ├── apps/
│   │   ├── users/          # User management & profiles
│   │   ├── learning/       # Core learning models
│   │   ├── gamification/   # Achievements, quests, power-ups
│   │   └── api/           # REST API endpoints
│   ├── backend/           # Django settings
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── utils/         # Helper functions
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
├── README.md
└── .env.example
```

## 🔧 Configuration

### Environment Variables

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=system_overload
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://127.0.0.1:6379/1

# AI
OPENROUTER_API_KEY=your-openrouter-key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🎮 Gameplay Mechanics

### Learning Flow
1. **World Map** - Choose subject region
2. **Topic Selection** - Pick specific topic
3. **Level Progression** - Complete levels sequentially
4. **Boss Battles** - Timed challenges at module end
5. **Progress Tracking** - Dashboard with analytics

### XP System
- **Base XP**: 100 per level completion
- **Accuracy Bonus**: Up to +50 XP for 100% accuracy
- **Speed Bonus**: +25 XP for completing under time limit
- **Streak Bonus**: +10 XP per consecutive day
- **Boss Multiplier**: 5x XP for boss victories

### Adaptive Difficulty
- **Performance Tracking**: Accuracy, time, hint usage
- **Dynamic Adjustment**: Questions adapt based on metrics
- **Weak Area Focus**: System resurfaces struggling topics
- **Personalized Paths**: Learning journey adapts to user

## 🤖 AI Integration

### Explanation Engine
- **Multi-level responses**: Simple, intermediate, technical
- **Context awareness**: Adapts to user progress
- **Visual analogies**: Relates concepts to real-world examples

### Question Generation
- **Dynamic creation**: Unlimited practice questions
- **Difficulty scaling**: Matches user performance
- **Subject-specific**: Tailored to each domain

### Answer Evaluation
- **Natural language processing**: Understands free-text responses
- **Partial credit**: Rewards correct reasoning
- **Detailed feedback**: Specific improvement suggestions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration

### Learning
- `GET /api/subjects/` - List subjects
- `GET /api/topics/` - List topics by subject
- `GET /api/levels/` - List levels by topic
- `POST /api/learning/start-level/` - Start level attempt
- `POST /api/learning/submit-answer/` - Submit answer
- `POST /api/learning/complete-level/` - Complete level

### AI Features
- `POST /api/ai/explain/` - Get AI explanation
- `POST /api/ai/evaluate/` - Evaluate answer
- `POST /api/ai/generate-question/` - Generate question

### Gamification
- `GET /api/dashboard/` - User dashboard
- `GET /api/user-progress/` - Progress data
- `GET /api/achievements/` - User achievements
- `GET /api/quests/` - Active quests
- `GET /api/power-ups/` - Available power-ups

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **CORS Protection** for API access
- **Input Validation** on all endpoints
- **Rate Limiting** for AI requests
- **SQL Injection Prevention** via ORM
- **XSS Protection** in templates

## 📈 Monitoring & Analytics

- **User Engagement Metrics** (session time, completion rates)
- **Learning Effectiveness** (knowledge retention, skill improvement)
- **System Performance** (response times, error rates)
- **AI Quality Metrics** (evaluation accuracy, explanation helpfulness)

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Static files collected
- [ ] SSL certificates installed
- [ ] Redis cache configured
- [ ] Celery workers running
- [ ] Monitoring tools set up

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Django community for excellent framework
- React ecosystem for powerful frontend tools
- Computer science education community for inspiration

---

**Ready to overload your learning system? 🚀**