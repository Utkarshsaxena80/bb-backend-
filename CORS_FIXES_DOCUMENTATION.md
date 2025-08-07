# CORS Configuration Fixes - Blood Bank Backend

## Overview
Fixed and enhanced the Access-Control-Allow-Origin header configuration in the Blood Bank backend to provide better security, flexibility, and debugging capabilities.

## Changes Made

### 1. Enhanced Main CORS Configuration (`src/index.ts`)

#### Before:
```typescript
app.use(
  cors({
    origin: ["https://bb-frontend-seven.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);
```

#### After:
```typescript
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: corsConfig.allowedMethods,
    allowedHeaders: corsConfig.allowedHeaders,
    credentials: corsConfig.credentials,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: corsConfig.maxAge,
  })
);
```

### 2. Centralized CORS Configuration (`config/cors.config.ts`)

**New Features:**
- ✅ Centralized configuration management
- ✅ Environment variable support for additional origins
- ✅ Type-safe configuration interface
- ✅ Comprehensive allowed headers and methods
- ✅ Logging functionality for debugging

**Supported Origins:**
- `http://localhost:3000` (Development)
- `http://localhost:3001` (Alternative development port)
- `https://bb-frontend-seven.vercel.app` (Production)
- `https://bloodbank-frontend.vercel.app` (Alternative production)
- Custom origins via `ADDITIONAL_CORS_ORIGINS` environment variable

### 3. Enhanced CORS Middleware (`middlewares/cors.middleware.ts`)

**Features:**
- ✅ Additional CORS header management
- ✅ Proper preflight request handling
- ✅ Security headers implementation
- ✅ Consistent with main CORS configuration

**Headers Set:**
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Expose-Headers`
- `Access-Control-Max-Age`

### 4. Security Enhancements

**Additional Security Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 5. Environment Configuration Support

**New Environment Variables:**
- `ADDITIONAL_CORS_ORIGINS` - Comma-separated list of additional allowed origins

**Example `.env` configuration:**
```env
ADDITIONAL_CORS_ORIGINS="https://your-custom-domain.com,https://another-domain.com"
```

## Configuration Details

### Allowed Methods
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`

### Allowed Headers
- `Content-Type`
- `Authorization`
- `X-Requested-With`
- `Accept`
- `Origin`
- `Access-Control-Request-Method`
- `Access-Control-Request-Headers`
- `Cache-Control`
- `Pragma`

### Exposed Headers
- `Content-Length`
- `Content-Range`
- `Set-Cookie`

### Other Settings
- **Credentials:** Enabled (`true`)
- **Max Age:** 86400 seconds (24 hours)
- **Options Success Status:** 200 (for legacy browser support)

## Benefits

### 🔒 **Security Improvements**
- Dynamic origin validation instead of static array
- Comprehensive security headers
- Proper handling of preflight requests
- Protection against XSS and clickjacking

### 🛠 **Development Experience**
- Clear logging of CORS configuration on startup
- Warning messages for blocked origins
- Environment-based configuration
- Type-safe configuration management

### 📈 **Scalability**
- Easy addition of new allowed origins
- Centralized configuration management
- Support for multiple environments
- Flexible header configuration

### 🐛 **Debugging**
- Detailed logging of CORS settings
- Clear error messages for blocked requests
- Startup configuration verification

## Usage

### Adding New Allowed Origins

#### Method 1: Environment Variable
```env
ADDITIONAL_CORS_ORIGINS="https://new-frontend.com,https://mobile-app.com"
```

#### Method 2: Update Configuration File
Edit `config/cors.config.ts`:
```typescript
const defaultOrigins = [
  "http://localhost:3000",
  "https://bb-frontend-seven.vercel.app",
  "https://your-new-domain.com", // Add new origin here
];
```

### Testing CORS Configuration

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check logs for CORS configuration:**
   ```
   🚀 Blood Bank Backend Server listening on port 5000
   🔒 CORS Configuration:
     📍 Allowed Origins: http://localhost:3000, https://bb-frontend-seven.vercel.app
     🔧 Allowed Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
     🍪 Credentials Enabled: true
     ⏰ Max Age: 86400 seconds
   ```

3. **Test with browser developer tools:**
   - Check Network tab for CORS headers
   - Verify `Access-Control-Allow-Origin` header is set correctly

### Troubleshooting

#### Common Issues and Solutions

1. **CORS Error: "Not allowed by CORS"**
   - Check if your frontend origin is in the allowed origins list
   - Add your origin to `ADDITIONAL_CORS_ORIGINS` environment variable

2. **Credentials not working**
   - Ensure both frontend and backend have `credentials: true`
   - Check that `Access-Control-Allow-Credentials: true` is set

3. **Preflight requests failing**
   - Verify OPTIONS method is allowed
   - Check that required headers are in `allowedHeaders` list

#### Debug Steps

1. **Check server logs** for CORS configuration and blocked requests
2. **Inspect browser developer tools** Network tab for CORS headers
3. **Verify environment variables** are loaded correctly
4. **Test with curl** to isolate frontend issues:
   ```bash
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        http://localhost:5000/donor-login
   ```

## Files Modified

1. **`src/index.ts`** - Main CORS configuration and middleware setup
2. **`middlewares/cors.middleware.ts`** - Enhanced CORS middleware (NEW)
3. **`config/cors.config.ts`** - Centralized CORS configuration (NEW)
4. **`.env.example`** - Environment configuration template (NEW)

## Future Improvements

- [ ] Rate limiting integration with CORS
- [ ] Dynamic origin validation from database
- [ ] CORS configuration API endpoint
- [ ] Monitoring and analytics for CORS requests
- [ ] Integration with CDN for production deployments
