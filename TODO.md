# TODO for Day-Off Request System Update

- [x] Update GET /requests in routes/requests.js to show all requests if user role is 'manager', else show only user's requests.
- [x] Add ownership check in PUT /requests/:id to ensure only the owner or manager can update.
- [x] Add ownership check in DELETE /requests/:id to ensure only the owner or manager can delete.
- [x] Test the changes.
