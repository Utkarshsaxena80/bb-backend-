# ByCity Endpoint Documentation

The `/getByCity` endpoint allows you to retrieve patients or donors based on city location.

## Required Parameters

The endpoint requires the following query parameters:

1. `field` - Must be either "1" (for patients) or "2" (for donors)
2. `city` - A non-empty string representing the city name to search for

## Optional Parameters

3. `match` - (Optional) Specifies the type of matching to use (e.g., "startsWith", "equals")

## Example Requests

### Get patients in a specific city
```
GET /getByCity?field=1&city=Mumbai
```

### Get donors in a specific city
```
GET /getByCity?field=2&city=Delhi&match=startsWith
```

## Response Format

Success Response:
```json
{
  "success": true,
  "message": "Found 5 patient(s) in Mumbai",
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "BloodBank": "City Blood Bank",
      "BloodType": "O+",
      "city": "Mumbai"
    },
    // ...more results
  ]
}
```

Error Response:
```json
{
  "success": false,
  "message": "Invalid input data",
  "error": "field: Invalid option: expected one of \"1\"|\"2\""
}
```

## Common Errors

1. Missing required parameters:
   - Missing `field` parameter
   - Missing `city` parameter

2. Invalid values:
   - `field` must be either "1" or "2"
   - `city` cannot be empty

## Recent Fixes

The endpoint has been updated to:
1. Add better validation for required parameters
2. Provide clearer error messages
3. Handle missing parameters gracefully
4. Support an optional `match` parameter
