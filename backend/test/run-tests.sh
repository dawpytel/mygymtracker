#!/bin/bash

# E2E Test Runner Script
# Provides convenient commands to run different test suites

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "Error: npm is not installed"
    exit 1
fi

# Main menu
if [ $# -eq 0 ]; then
    print_header "E2E Test Suite"
    echo "Usage: ./run-tests.sh [option]"
    echo ""
    echo "Options:"
    echo "  all               Run all E2E tests"
    echo "  auth              Run authentication tests"
    echo "  users             Run users tests"
    echo "  exercises         Run exercises tests"
    echo "  plans             Run workout plans tests"
    echo "  sessions          Run workout sessions tests"
    echo "  sets              Run exercise sets tests"
    echo "  validation        Run validation-specific tests"
    echo "  authorization     Run authorization-specific tests"
    echo "  coverage          Run tests with coverage report"
    echo "  watch             Run tests in watch mode"
    echo "  quick             Run quick smoke test"
    echo ""
    echo "Examples:"
    echo "  ./run-tests.sh all"
    echo "  ./run-tests.sh auth"
    echo "  ./run-tests.sh coverage"
    exit 0
fi

case $1 in
    all)
        print_header "Running All E2E Tests"
        npm run test:e2e
        ;;
    
    auth)
        print_header "Running Authentication Tests"
        npm run test:e2e -- auth.e2e-spec.ts
        ;;
    
    users)
        print_header "Running Users Tests"
        npm run test:e2e -- users.e2e-spec.ts
        ;;
    
    exercises)
        print_header "Running Exercises Tests"
        npm run test:e2e -- exercises.e2e-spec.ts
        ;;
    
    plans)
        print_header "Running Workout Plans Tests"
        npm run test:e2e -- workout-plans.e2e-spec.ts
        ;;
    
    sessions)
        print_header "Running Workout Sessions Tests"
        npm run test:e2e -- workout-sessions.e2e-spec.ts
        ;;
    
    sets)
        print_header "Running Exercise Sets Tests"
        npm run test:e2e -- exercise-sets.e2e-spec.ts
        ;;
    
    validation)
        print_header "Running Validation Tests"
        print_info "Running all tests that validate input data..."
        npm run test:e2e -- --testNamePattern="should reject"
        ;;
    
    authorization)
        print_header "Running Authorization Tests"
        print_info "Running all tests that verify authentication and ownership..."
        npm run test:e2e -- --testNamePattern="401|403|authorization|without.*token|another user"
        ;;
    
    coverage)
        print_header "Running Tests with Coverage"
        npm run test:cov
        print_info "Coverage report generated in coverage/lcov-report/index.html"
        ;;
    
    watch)
        print_header "Running Tests in Watch Mode"
        print_info "Tests will re-run when files change. Press Ctrl+C to exit."
        npm run test:e2e -- --watch
        ;;
    
    quick)
        print_header "Running Quick Smoke Test"
        print_info "Running key tests from each module..."
        npm run test:e2e -- --testNamePattern="should (create|return|login|register)" --maxWorkers=4
        ;;
    
    *)
        print_error "Unknown option: $1"
        print_info "Run './run-tests.sh' without arguments to see available options"
        exit 1
        ;;
esac

echo ""
print_info "Test execution completed!"

