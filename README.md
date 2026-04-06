# PBW Dropshipper Portal - Integrated Version

This is an integrated version of the PBW Dropshipper Portal that combines the main website with the order tracker functionality.

## Features

- **Main Website**: Full dropshipper portal with dashboard, order management, and admin features
- **Order Tracker**: Integrated tracker that opens in a new window when "Track Order" is clicked
- **Unified Styling**: Both the main site and tracker share consistent colors, fonts, and design
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project Structure

```
pbw-integrated/
├── client/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Track.tsx
│   │   │   ├── tracker/
│   │   │   │   └── TrackerHome.tsx  # Order tracker page
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── ...
│   └── index.html
├── server/                 # Backend (Express + Node.js)
├── shared/                 # Shared types and utilities
├── drizzle/               # Database migrations
├── package.json
└── README.md
```

## Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory with the necessary configuration.

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

## Building for Production

```bash
pnpm build
pnpm start
```

## Key Integration Points

### Track Order Buttons
All "Track Order" buttons throughout the application now open the tracker in a new window:

- **Landing page**: Header navigation and hero section buttons
- **Dashboard**: Sidebar navigation for both agents and admins
- **Footer**: Quick access link

### Tracker Routes
- `/track` - Original track page (kept for backward compatibility)
- `/tracker` - New integrated tracker page (opens in new window)

### Styling Consistency
The tracker uses the same:
- **Color scheme**: Primary, secondary, and accent colors
- **Typography**: Font families and sizing
- **Components**: UI components from the shared component library
- **Tailwind CSS**: Same configuration and utilities

## Development Notes

- The tracker page is located at `/client/src/pages/tracker/TrackerHome.tsx`
- All Track Order button clicks use `window.open("/tracker", "_blank")` to open in a new window
- The tracker maintains full functionality while being visually consistent with the main site
- Both applications use the same database and authentication system

## Deployment

This project is ready to be deployed to GitHub. Simply push the entire directory to your repository:

```bash
git init
git add .
git commit -m "Initial commit: Integrated PBW Portal"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Support

For issues or questions, please refer to the original project documentation or create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: April 4, 2026
