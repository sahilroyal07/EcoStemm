# Project Structure

This project has been reorganized to separate frontend and backend concerns with consolidated components.

## New Structure

```
secure-file-share/
├── src/
│   ├── components/
│   │   └── MainApp.js          # Consolidated main application component
│   ├── services/
│   │   └── fileService.js      # Frontend service layer for API calls
│   ├── App.js                  # Main entry point (now simplified)
│   ├── App.css                 # Styles
│   └── config/
│       └── environment.js      # Configuration
├── backend/
│   └── api/
│       └── server.js           # Backend API functions
└── server/                     # Legacy server files (can be removed)
```

## Key Changes

1. **Consolidated Components**: All UI components (Dashboard, FileCard, FileRetriever, etc.) are now integrated into a single `MainApp.js` component
2. **Separated Concerns**: Frontend and backend code are now in separate directories
3. **Simplified Structure**: Reduced from 8+ component files to 1 main component
4. **Clean Separation**: Frontend services handle API calls, backend handles server logic

## Benefits

- **Easier Maintenance**: Single component to manage instead of multiple files
- **Better Organization**: Clear separation between frontend and backend
- **Reduced Complexity**: Fewer files to navigate and understand
- **Consolidated Logic**: All related functionality in one place

## Usage

The application now uses a single `MainApp` component that contains all the functionality previously spread across multiple components. The main `App.js` simply imports and renders this consolidated component.
