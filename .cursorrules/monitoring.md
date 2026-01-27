# Monitoring & Observability

## Error Tracking

- Client-side errors captured and logged
- Server-side errors logged with context
- User actions tracked (with consent)

## Performance Monitoring

- Real User Monitoring (RUM) via Cloudflare Analytics
- Core Web Vitals tracking
- API response time monitoring

## Logging Structure

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context: {
    userId?: string;
    action?: string;
    route?: string;
    error?: Error;
  };
}
```

## Monitoring Checklist

- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Logs include sufficient context
- [ ] Alerts configured for critical errors
- [ ] Core Web Vitals tracked
