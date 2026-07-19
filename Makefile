.PHONY: help backend-setup backend-run backend-test backend-install backend-db frontend-run all dev test clean

help:
	@echo "CivicLens AI - Command Reference"
	@echo "=================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make backend-setup     - Setup backend (install deps, create .env, init db)"
	@echo "  make backend-install   - Install Python dependencies only"
	@echo "  make backend-db        - Initialize SQLite database"
	@echo ""
	@echo "Running:"
	@echo "  make backend-run       - Start FastAPI backend server"
	@echo "  make frontend-run      - Start Vite frontend dev server"
	@echo "  make all               - Start both backend and frontend"
	@echo "  make dev               - Start all services with hot reload"
	@echo ""
	@echo "Testing:"
	@echo "  make backend-test      - Run integration tests"
	@echo "  make test              - Run all tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             - Remove database and cache files"
	@echo ""
	@echo "Documentation:"
	@echo "  Backend API:  http://localhost:8000/docs"
	@echo "  Frontend:     http://localhost:5173"

backend-setup:
	python setup_backend.py

backend-install:
	cd backend && pip install -r requirements.txt

backend-db:
	cd backend && python -c "from database import init_db; init_db(); print('✅ Database initialized')"

backend-run:
	cd backend && python -m uvicorn main:app --reload

frontend-run:
	npm run dev

backend-test:
	python test_backend.py

test: backend-test

all: backend-run frontend-run

dev:
	@echo "Starting CivicLens AI (Backend + Frontend)..."
	@echo "Backend will run on: http://localhost:8000"
	@echo "Frontend will run on: http://localhost:5173"
	@echo "API docs: http://localhost:8000/docs"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@make all

clean:
	rm -f backend/complaints.db
	rm -rf backend/__pycache__
	rm -rf src/__pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
	echo "✅ Cleaned up cache and database"

.DEFAULT_GOAL := help
