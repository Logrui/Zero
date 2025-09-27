# Quickstart: Notifications System Testing

This document provides step-by-step instructions to validate the notifications system functionality after implementation.

## Prerequisites

1. Zero OS application running locally
2. User account created and logged in
3. Database migrations completed
4. API endpoints implemented

## Test Scenarios

### Scenario 1: API Key Management

**Test Steps:**
1. Navigate to user settings or API keys section
2. Click "Create API Key"
3. Enter name: "Test Integration Key"
4. Copy the generated API key (shown only once)
5. Verify key appears in API keys list
6. Test key revocation

**Expected Results:**
- API key created successfully
- Key displayed once with warning about copying it
- Key appears in list without plain text value
- Key can be revoked and becomes inactive

### Scenario 2: External Notification Creation

**Test Steps:**
1. Use the API key from Scenario 1
2. Send POST request to `/api/v1/notifications`:
   ```bash
   curl -X POST http://localhost:3000/api/v1/notifications \
     -H "X-API-Key: YOUR_API_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{
       "subject": "Test External Notification",
       "body": "This is a test notification from external system",
       "tags": ["N8N", "External Integration", "Test"]
     }'
   ```
3. Check response for 201 status code

**Expected Results:**
- Request returns 201 Created status
- Response contains notification object with ID
- Notification appears in user's dashboard

### Scenario 3: Notifications Dashboard

**Test Steps:**
1. Navigate to `/notifications` page
2. Verify external notification from Scenario 2 appears
3. Test tag filtering by clicking "N8N" tag
4. Test "mark as read" functionality
5. Test notification deletion

**Expected Results:**
- Dashboard loads with notifications list
- Filtering works correctly
- Read status updates visually
- Deleted notifications disappear from list

### Scenario 4: Notification Overlay Preview

**Test Steps:**
1. From any page, click the notifications icon in the bottom bar
2. Verify overlay appears showing recent notifications
3. Check that 10 notifications are visible in viewport
4. Test scrolling to see additional notifications (if more than 10)
5. Verify notifications show subject and one line of body
6. Test expanding subject for brief viewing

**Expected Results:**
- Medium-sized overlay appears over current page
- Recent 50 notifications loaded (10 visible, rest scrollable)
- Each notification displays subject and body preview
- Subject expansion works for longer titles
- Overlay is responsive and smooth

### Scenario 5: Individual Notification Navigation

**Test Steps:**
1. Open notifications overlay from Scenario 4
2. Click on any notification in the overlay
3. Verify new tab opens to `/notifications/{uuid}`
4. Check that individual notification page displays full details
5. Test navigation back to main dashboard

**Expected Results:**
- Clicking notification opens new tab
- URL follows pattern `/notifications/{valid-uuid}`
- Individual page shows complete notification details
- Page integrates with existing Zero OS navigation

### Scenario 4: Internal Notifications

**Test Steps:**
1. Trigger an internal system event (e.g., calendar sync)
2. Check notifications dashboard for system notification
3. Verify notification has "System" tag
4. Verify notification shows appropriate source

**Expected Results:**
- Internal notification appears automatically
- Notification has correct metadata (tags, source)
- User can interact with it like external notifications

### Scenario 5: Rate Limiting

**Test Steps:**
1. Use API key from Scenario 1
2. Send multiple rapid requests (>10 per minute)
3. Verify rate limiting response after threshold

**Expected Results:**
- Initial requests succeed (201 status)
- Excess requests return 429 Too Many Requests
- Rate limiting resets after time window

### Scenario 6: High Volume Processing

**Test Steps:**
1. Send 50+ notifications via API in quick succession
2. Monitor dashboard for notification appearance
3. Check system performance during processing

**Expected Results:**
- All notifications eventually appear in dashboard
- System remains responsive
- No duplicate or lost notifications

### Scenario 7: Tag Management

**Test Steps:**
1. Create notification with new tag "Custom Tag"
2. Verify tag appears in filter options
3. Create another notification with same tag
4. Test filtering by custom tag

**Expected Results:**
- New tags created automatically
- Tag appears in filter dropdown
- Filtering works with custom tags

### Scenario 8: Bulk Operations

**Test Steps:**
1. Select multiple notifications in dashboard
2. Perform bulk delete operation
3. Verify all selected notifications removed

**Expected Results:**
- Bulk selection UI works correctly
- All selected notifications deleted
- Dashboard updates appropriately

## Performance Validation

### Response Time Tests
- Notification creation: < 500ms
- Dashboard loading: < 2s for 100 notifications
- Filtering operations: < 1s
- Tag loading: < 500ms

### Scalability Tests
- 1000 notifications per user: Dashboard remains usable
- 100+ tags: Filter dropdown performs well
- Concurrent API requests: No data corruption

## Error Handling Tests

### Invalid API Key
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "X-API-Key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Test", "body": "Test", "tags": ["Test"]}'
```
**Expected**: 401 Unauthorized

### Invalid Payload
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "X-API-Key: YOUR_VALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subject": "", "body": "Test"}'
```
**Expected**: 400 Bad Request with validation errors

### Missing Authentication
```bash
curl -X GET http://localhost:3000/api/v1/notifications
```
**Expected**: 401 Unauthorized

## Integration Testing

### N8N Webhook Integration
1. Set up N8N workflow with webhook
2. Configure webhook to use notifications API
3. Trigger workflow and verify notification creation
4. Test error handling for malformed webhooks

### Calendar Event Integration
1. Sync calendar events
2. Verify system notifications created
3. Check notification content accuracy
4. Test multiple calendar sources

## Acceptance Criteria Validation

Each functional requirement from the specification should be validated:

- ✅ **FR-001**: Secure API endpoint accepts HTTP POST requests
- ✅ **FR-002**: API secured with user-generated API key
- ✅ **FR-003**: Users can generate and manage API keys
- ✅ **FR-004**: System generates internal notifications
- ✅ **FR-005**: Notifications include subject, body, and tags
- ✅ **FR-006**: `/notifications` page displays dashboard
- ✅ **FR-007**: Dashboard allows tag-based filtering
- ✅ **FR-008**: Users can manually delete notifications

- ✅ **NFR-001**: Asynchronous processing with queue
- ✅ **NFR-002**: Rate limiting on API endpoint

## Troubleshooting Common Issues

### Notifications Not Appearing
1. Check API response status codes
2. Verify user authentication
3. Check database logs for errors
4. Verify queue processing is running

### Rate Limiting Too Aggressive
1. Check rate limit configuration
2. Verify API key usage tracking
3. Adjust rate limit thresholds if needed

### Performance Issues
1. Monitor database query performance
2. Check index usage on large datasets
3. Verify queue processing efficiency
4. Test with representative data volumes

## Success Metrics

- All test scenarios pass without errors
- Performance targets met
- Error handling works as expected
- Integration points function correctly
- User interface is intuitive and responsive