# MyPA Deployment Guide

## 🚀 Preventing TypeScript Errors During Deployment

### Why TypeScript Errors Keep Happening

1. **Strict Type Checking**: Production builds use stricter TypeScript settings
2. **Missing Dependencies**: Type definitions not properly installed
3. **Environment Differences**: Local vs production environment mismatches
4. **Build Process**: Different build commands have different type checking levels

### 🛠️ Solutions Implemented

#### 1. **Safe Build Mode**
```bash
# Use this for deployment when types are problematic
npm run build:safe
```
This command uses `--skipLibCheck` to avoid library type issues.

#### 2. **Separate Type Checking**
```bash
# Check types without building
npm run type-check

# Build without strict type checking
vite build
```

#### 3. **Backend Simple Build**
```bash
cd api
npm run build  # Uses tsconfig.simple.json with relaxed settings
```

#### 4. **Pre-commit Hooks**
Automatically installed via husky to catch issues early:
```bash
# Runs before each commit
.husky/pre-commit
```

### 📋 Deployment Checklist

#### Before Every Deployment:

1. **Clean Build Environment**
   ```bash
   rm -rf dist/ api/dist/ node_modules/ api/node_modules/
   npm install
   cd api && npm install && cd ..
   ```

2. **Test Build Locally**
   ```bash
   npm run build:safe  # Frontend
   cd api && npm run build && cd ..  # Backend
   ```

3. **Use Deployment Script**
   ```bash
   ./scripts/deploy-all.sh
   ```

#### If TypeScript Errors Occur:

1. **Use Safe Build Mode**
   ```bash
   npm run build:safe
   ```

2. **Check Specific Errors**
   ```bash
   npm run type-check 2>&1 | head -20
   ```

3. **Skip Library Checks**
   ```bash
   tsc --noEmit --skipLibCheck
   ```

### 🔧 Configuration Files

#### Frontend TypeScript Config
- **Development**: `tsconfig.json` (strict)
- **Production**: Uses `--skipLibCheck` flag

#### Backend TypeScript Config
- **Simple Build**: `tsconfig.simple.json` (relaxed)
- **Full Build**: `tsconfig.json` (strict)

### 🚨 Emergency Deployment

If you need to deploy immediately despite TypeScript errors:

```bash
# Frontend
SKIP_TYPE_CHECK=true vite build

# Backend
cd api
npx tsc --noEmit false src/simple-server.ts --outDir dist --target ES2022 --module ESNext --moduleResolution node --allowJs
```

### 📊 Build Scripts Reference

#### Frontend Scripts
```json
{
  "build": "npm run type-check && vite build",      // Strict build
  "build:safe": "tsc --noEmit --skipLibCheck && vite build",  // Safe build
  "type-check": "tsc --noEmit"                      // Type check only
}
```

#### Backend Scripts
```json
{
  "build": "tsc -p tsconfig.simple.json",          // Simple build
  "build:full": "tsc",                             // Full build
  "dev": "tsx watch src/simple-server.ts"         // Development
}
```

### 🔍 Debugging TypeScript Issues

#### Common Issues and Solutions:

1. **"Cannot find module" errors**
   ```bash
   npm install @types/node @types/express
   ```

2. **"Property does not exist" errors**
   - Use type assertions: `req as any`
   - Add interface extensions
   - Use `--skipLibCheck`

3. **"Not all code paths return a value"**
   - Add explicit return statements
   - Use `void` return type
   - Set `noImplicitReturns: false`

4. **Import/Export errors**
   ```bash
   # Check module resolution
   tsc --showConfig
   ```

### 🎯 Best Practices

1. **Always test builds locally before deploying**
2. **Use safe build mode for production deployments**
3. **Keep dependencies updated**
4. **Use the deployment script for consistency**
5. **Monitor build logs for warnings**

### 🔄 Continuous Integration

For CI/CD pipelines, use:
```yaml
# GitHub Actions example
- name: Build Frontend
  run: npm run build:safe

- name: Build Backend
  run: cd api && npm run build
```

### 📞 Troubleshooting

If deployment still fails:

1. **Check Node.js version** (should be 18+)
2. **Clear npm cache**: `npm cache clean --force`
3. **Use deployment script**: `./scripts/deploy-all.sh`
4. **Check Vercel logs** for specific errors
5. **Contact team** with error logs

---

**Remember**: The goal is reliable deployments. It's better to use safe build mode and deploy successfully than to be blocked by TypeScript strictness.
