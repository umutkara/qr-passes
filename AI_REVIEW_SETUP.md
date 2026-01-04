# AI Review Setup Guide

## Environment Variables

Add to your `.env.bot` file:

```bash
# For local development (Windows/Mac/Linux)
AI_REVIEW_URL=http://127.0.0.1:3001/api/ai/review

# For Docker on Windows
# AI_REVIEW_URL=http://host.docker.internal:3000/api/ai/review
```

## Network Error Fix

The ECONNREFUSED error is fixed by:

1. Using configurable `AI_REVIEW_URL` instead of hardcoded localhost
2. Docker on Windows uses `host.docker.internal` to reach host machine
3. Local development uses `127.0.0.1:3001` (server port)
4. Fallback AI result ensures pipeline continues even when AI endpoint is unreachable</contents>
</xai:function_call">F


