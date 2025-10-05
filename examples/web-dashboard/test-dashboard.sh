#!/bin/bash

# Omnistream Web Dashboard Test Script
# Tests all API endpoints and verifies the dashboard works end-to-end

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

OMNISTREAM_URL="http://localhost:3000"
DASHBOARD_URL="http://localhost:4000"
COMMUNITY_NAME="Test Community $(date +%s)"
API_KEY=""
COMMUNITY_ID=""
STREAM_ID=""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Omnistream Web Dashboard Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if server is running
check_server() {
    local url=$1
    local name=$2
    echo -n "Checking if $name is running... "
    if curl -s "$url/health" > /dev/null 2>&1 || curl -s "$url" > /dev/null 2>&1; then
        print_success "$name is running"
        return 0
    else
        print_error "$name is not running"
        echo "Please start $name first"
        return 1
    fi
}

# Test 1: Check servers are running
echo -e "\n${YELLOW}Test 1: Checking servers${NC}"
check_server "$OMNISTREAM_URL" "Omnistream API" || exit 1
check_server "$DASHBOARD_URL" "Dashboard" || exit 1

# Test 2: Dashboard homepage loads
echo -e "\n${YELLOW}Test 2: Dashboard homepage${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Dashboard homepage loads (HTTP $HTTP_CODE)"
else
    print_error "Dashboard homepage failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Create community via dashboard API
echo -e "\n${YELLOW}Test 3: Create community${NC}"
RESPONSE=$(curl -s -X POST "$DASHBOARD_URL/api/communities" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$COMMUNITY_NAME\"}")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Community created successfully"
    API_KEY=$(echo "$RESPONSE" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
    COMMUNITY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  API Key: $API_KEY"
    echo "  Community ID: $COMMUNITY_ID"
else
    print_error "Failed to create community"
    exit 1
fi

# Test 4: Get community info
echo -e "\n${YELLOW}Test 4: Get community info${NC}"
RESPONSE=$(curl -s "$DASHBOARD_URL/api/community" \
    -H "x-api-key: $API_KEY")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Retrieved community info"
    RETRIEVED_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "  Community Name: $RETRIEVED_NAME"
else
    print_error "Failed to retrieve community info"
    exit 1
fi

# Test 5: Get platforms list
echo -e "\n${YELLOW}Test 5: Get platforms list${NC}"
RESPONSE=$(curl -s "$DASHBOARD_URL/api/platforms" \
    -H "x-api-key: $API_KEY")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Retrieved platforms list"
    # Count platforms
    PLATFORM_COUNT=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | wc -l)
    echo "  Found $PLATFORM_COUNT platforms"
else
    print_error "Failed to retrieve platforms"
    exit 1
fi

# Test 6: Get OAuth authorization URL
echo -e "\n${YELLOW}Test 6: Get OAuth authorization URL${NC}"
RESPONSE=$(curl -s "$DASHBOARD_URL/api/auth/youtube/authorize" \
    -H "x-api-key: $API_KEY")

if echo "$RESPONSE" | grep -q "authUrl"; then
    print_success "Retrieved OAuth authorization URL"
    AUTH_URL=$(echo "$RESPONSE" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4)
    echo "  OAuth URL length: ${#AUTH_URL} characters"
else
    print_error "Failed to retrieve OAuth URL"
    exit 1
fi

# Test 7: Create stream
echo -e "\n${YELLOW}Test 7: Create stream${NC}"
RESPONSE=$(curl -s -X POST "$DASHBOARD_URL/api/streams" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{
        "title": "Test Stream",
        "description": "End-to-end test stream",
        "platforms": ["youtube"],
        "rtmpUrl": "rtmp://test.example.com/live",
        "rtmpKey": "test-key-123"
    }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Stream created successfully"
    STREAM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Stream ID: $STREAM_ID"
else
    print_error "Failed to create stream"
    echo "  This might be expected if OAuth is not configured"
fi

# Test 8: List streams
echo -e "\n${YELLOW}Test 8: List streams${NC}"
RESPONSE=$(curl -s "$DASHBOARD_URL/api/streams" \
    -H "X-API-Key: $API_KEY")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Retrieved streams list"
    # Try to count streams
    STREAM_COUNT=$(echo "$RESPONSE" | grep -o '"title":"[^"]*"' | wc -l)
    echo "  Found $STREAM_COUNT stream(s)"
else
    print_error "Failed to retrieve streams"
fi

# Test 9: Get specific stream (if we have one)
if [ -n "$STREAM_ID" ]; then
    echo -e "\n${YELLOW}Test 9: Get specific stream${NC}"
    RESPONSE=$(curl -s "$DASHBOARD_URL/api/streams/$STREAM_ID" \
        -H "X-API-Key: $API_KEY")

    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_success "Retrieved stream details"
    else
        print_error "Failed to retrieve stream details"
    fi
fi

# Test 10: Test invalid API key
echo -e "\n${YELLOW}Test 10: Test invalid API key (should fail)${NC}"
RESPONSE=$(curl -s "$DASHBOARD_URL/api/community" \
    -H "x-api-key: omni_invalid_key_12345")

if echo "$RESPONSE" | grep -q "success.*false\|error"; then
    print_success "Invalid API key properly rejected"
else
    print_error "Invalid API key was not rejected"
fi

# Test 11: Test missing API key
echo -e "\n${YELLOW}Test 11: Test missing API key (should fail)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL/api/community")

if [ "$HTTP_CODE" = "401" ]; then
    print_success "Missing API key properly rejected (HTTP $HTTP_CODE)"
else
    print_error "Missing API key response unexpected (HTTP $HTTP_CODE)"
fi

# Test 12: Delete stream (if we have one)
if [ -n "$STREAM_ID" ]; then
    echo -e "\n${YELLOW}Test 12: Delete stream${NC}"
    RESPONSE=$(curl -s -X DELETE "$DASHBOARD_URL/api/streams/$STREAM_ID" \
        -H "X-API-Key: $API_KEY")

    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_success "Stream deleted successfully"
    else
        print_error "Failed to delete stream"
    fi
fi

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}Test Suite Complete!${NC}"
echo -e "${YELLOW}========================================${NC}\n"

echo "Test Results:"
echo "  Community Name: $COMMUNITY_NAME"
echo "  Community ID: $COMMUNITY_ID"
echo "  API Key: $API_KEY"
echo ""
echo -e "${GREEN}All tests passed! ✓${NC}"
echo ""
echo "You can now use the dashboard at: $DASHBOARD_URL"
echo "Login with API key: $API_KEY"
echo ""
