# YeneRent Feature Implementation TODO

## 1. UI Enhancements
- [ ] Add automatic comma formatting to number inputs in all add methods (properties, tenants, leases, payments, etc.)
- [ ] Implement automatic withholding tax calculation in payment recording (excluding type)

## 2. Settings Page Updates
- [ ] Add VAT settings option (include/exclude VAT, set VAT amount)
- [ ] Update settingsService to handle VAT preferences

## 3. Profile Page Enhancements
- [ ] Display current subscription/package model in profile
- [ ] Add option to update subscription model with redirect to appropriate page

## 4. Setup Page Creation
- [ ] Create setup page for post-subscription selection
- [ ] Implement payment process and receipt upload functionality

## 5. Admin User Request Management
- [ ] Create user request model and API endpoints
- [ ] Add admin interface to view user requests
- [ ] Implement grant/refuse/pending actions with messaging
- [ ] Add notifications system for user messages

## 6. Notification System Enhancements
- [ ] Update notifications to show admin messages
- [ ] Create dedicated page for message details

## 7. Backend Updates
- [ ] Update models for subscription, requests, notifications
- [ ] Add API routes for request management
- [ ] Implement withholding tax calculations in backend

## 8. Testing and Validation
- [ ] Test all new features
- [ ] Validate UI changes across different screens
- [ ] Ensure proper error handling
