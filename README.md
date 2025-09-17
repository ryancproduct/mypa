# MyPA Notes PWA

AI-powered personal productivity assistant with secure backend architecture.

## 🚀 Features

- **Daily Task Management**: Priorities, schedule, and follow-ups
- **AI Assistant**: Claude and OpenAI integration for smart task parsing
- **Secure Architecture**: Backend proxy eliminates API key exposure
- **Offline Support**: PWA with service worker caching
- **Cross-Platform**: Works on desktop and mobile
- **Real-time Sync**: Supabase integration for data persistence

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  AI Providers   │
│   (React PWA)   │    │   (Node.js)     │    │  (Anthropic,    │
│                 │    │                 │    │   OpenAI)       │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ ProxyProvider│◄┼────┼►│ AIProxyService│◄┼────┼►                │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │                 │    │                 │
│ JWT Token Only  │    │ API Keys Stored │    │ Direct API Calls│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
