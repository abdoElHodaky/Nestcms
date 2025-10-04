#!/bin/bash

# 🚀 NestCMS MongoDB Read Replica Setup Script
# This script sets up the complete MongoDB read replica environment

set -e

echo "🚀 Starting NestCMS MongoDB Read Replica Setup..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Check if Docker and Docker Compose are installed
print_header "Checking Prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Create necessary directories
print_header "Creating Directory Structure"

directories=(
    "data/mongodb/primary"
    "data/mongodb/replica1"
    "data/mongodb/replica2"
    "data/mongodb/replica3"
    "data/redis"
    "logs"
    "uploads"
    "scripts"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_status "Created directory: $dir"
    else
        print_info "Directory already exists: $dir"
    fi
done

# Set proper permissions
print_header "Setting Directory Permissions"

chmod -R 755 data/
chmod -R 755 logs/
chmod -R 755 uploads/
chmod +x scripts/*.sh 2>/dev/null || true

print_status "Directory permissions set"

# Create environment file if it doesn't exist
print_header "Creating Environment Configuration"

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_status "Created .env file from .env.example"
    print_warning "Please update the .env file with your specific configuration"
else
    print_info ".env file already exists"
fi

# Stop any existing containers
print_header "Stopping Existing Containers"

docker-compose down --remove-orphans 2>/dev/null || true
print_status "Stopped existing containers"

# Pull latest images
print_header "Pulling Docker Images"

docker-compose pull
print_status "Docker images pulled"

# Start MongoDB primary first
print_header "Starting MongoDB Primary Database"

docker-compose up -d mongodb-primary
print_info "Waiting for MongoDB primary to be ready..."

# Wait for primary to be healthy
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps mongodb-primary | grep -q "healthy"; then
        print_status "MongoDB primary is healthy"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "MongoDB primary failed to start within expected time"
    docker-compose logs mongodb-primary
    exit 1
fi

# Start Redis cache
print_header "Starting Redis Cache"

docker-compose up -d redis
print_info "Waiting for Redis to be ready..."

# Wait for Redis to be healthy
max_attempts=15
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps redis | grep -q "healthy"; then
        print_status "Redis is healthy"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Redis failed to start within expected time"
    docker-compose logs redis
    exit 1
fi

# Start MongoDB replicas
print_header "Starting MongoDB Read Replicas"

docker-compose up -d mongodb-replica1 mongodb-replica2 mongodb-replica3
print_info "Waiting for MongoDB replicas to be ready..."

# Wait for all replicas to be healthy
services=("mongodb-replica1" "mongodb-replica2" "mongodb-replica3")
for service in "${services[@]}"; do
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            print_status "$service is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "$service failed to start within expected time"
        docker-compose logs $service
        exit 1
    fi
done

# Wait additional time for replica set initialization
print_info "Waiting for replica set initialization to complete..."
sleep 30

# Check replica set status
print_header "Checking Replica Set Status"

replica_status=$(docker-compose exec -T mongodb-primary mongosh --quiet --eval "
try {
    const status = rs.status();
    if (status.ok === 1) {
        print('Replica set is healthy');
        status.members.forEach((member, index) => {
            print(\`Member \${index + 1}: \${member.name} - \${member.stateStr}\`);
        });
        print('SUCCESS');
    } else {
        print('Replica set is not healthy');
        print('FAILED');
    }
} catch (error) {
    print('Error checking replica set status: ' + error);
    print('FAILED');
}
" 2>/dev/null || echo "FAILED")

if echo "$replica_status" | grep -q "SUCCESS"; then
    print_status "Replica set is properly configured"
    echo "$replica_status" | grep -v "SUCCESS"
else
    print_warning "Replica set may not be fully initialized yet"
    print_info "This is normal on first startup. The replica set will initialize automatically."
fi

# Start the application
print_header "Starting NestCMS Application"

docker-compose up -d nestcms-app
print_info "Waiting for NestCMS application to be ready..."

# Wait for application to be healthy
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps nestcms-app | grep -q "healthy"; then
        print_status "NestCMS application is healthy"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    print_warning "NestCMS application may still be starting up"
    print_info "Check the logs with: docker-compose logs nestcms-app"
fi

# Start monitoring services
print_header "Starting Monitoring Services"

docker-compose up -d mongo-express redis-commander 2>/dev/null || print_info "Monitoring services not configured"

# Display final status
print_header "Final System Status"

echo ""
echo "🎉 NestCMS MongoDB Read Replica Setup Complete!"
echo "=============================================="
echo ""

# Display service status
print_info "Service Status:"
docker-compose ps

echo ""
print_info "🌐 Access URLs:"
echo "  • NestCMS Application: http://localhost:3000"
echo "  • Health Check: http://localhost:3000/health"
echo "  • Detailed Health: http://localhost:3000/health/detailed"
echo "  • Database Health: http://localhost:3000/health/database"
echo "  • Aggregation Metrics: http://localhost:3000/health/aggregation/metrics"
echo "  • Database Connections: http://localhost:3000/health/database/connections"
echo "  • Replica Health: http://localhost:3000/health/database/replicas"

if docker-compose ps mongo-express &>/dev/null; then
    echo "  • MongoDB Admin: http://localhost:8082 (admin/admin123)"
fi

if docker-compose ps redis-commander &>/dev/null; then
    echo "  • Redis Admin: http://localhost:8081"
fi

echo ""
print_info "📊 Database Connections:"
echo "  • Primary (Write): mongodb://admin:password123@localhost:27017/nestcms"
echo "  • Replica 1 (Analytics): mongodb://admin:password123@localhost:27018/nestcms"
echo "  • Replica 2 (Reporting): mongodb://admin:password123@localhost:27019/nestcms"
echo "  • Replica 3 (Aggregation): mongodb://admin:password123@localhost:27020/nestcms"

echo ""
print_info "🔧 Useful Commands:"
echo "  • View logs: docker-compose logs -f [service-name]"
echo "  • Check status: docker-compose ps"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart [service-name]"
echo "  • Check replica set: docker-compose exec mongodb-primary mongosh --eval 'rs.status()'"

echo ""
print_info "📁 Data Directories:"
echo "  • MongoDB Primary: ./data/mongodb/primary"
echo "  • MongoDB Replica 1: ./data/mongodb/replica1"
echo "  • MongoDB Replica 2: ./data/mongodb/replica2"
echo "  • MongoDB Replica 3: ./data/mongodb/replica3"
echo "  • Redis Cache: ./data/redis"
echo "  • Application Logs: ./logs"
echo "  • File Uploads: ./uploads"

echo ""
print_status "🚀 Your NestCMS application with MongoDB read replicas is now running!"
print_info "📖 Check the documentation in docs/diagrams/ for architecture details"

# Check if replica set needs manual initialization
if ! echo "$replica_status" | grep -q "SUCCESS"; then
    echo ""
    print_warning "⚠️  If the replica set is not fully initialized, you can manually initialize it:"
    echo "   docker-compose exec mongodb-primary mongosh --eval 'rs.initiate()'"
    echo "   Then wait a few minutes and check: docker-compose exec mongodb-primary mongosh --eval 'rs.status()'"
fi

echo ""
print_header "Setup Complete! 🎉"

