# Landbys Cup

A web application for managing shooting competition results built with React, Vite, TailwindCSS, and Firebase.

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/perhackarn/landbyscup.git
cd landbyscup
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase (optional):
   - Copy `.env.example` to `.env`
   - Fill in your Firebase project credentials
   - If you don't provide environment variables, the app will use the default credentials

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
landbyscup/
├── src/
│   ├── App.jsx           # Main React application
│   ├── auth.js           # Authentication UI handling
│   ├── firebase.js       # Firebase configuration and exports
│   ├── index.css         # Tailwind CSS imports
│   └── main.jsx          # React entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.cjs   # Tailwind CSS configuration
├── postcss.config.cjs    # PostCSS configuration
└── package.json          # Dependencies and scripts
```

## Features

- Competition management
- Shooter registration
- Score tracking
- Results calculation with tiebreakers
- Cup standings
- PDF export for results and standings
- Firebase authentication and Firestore database

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Firebase** - Backend services (Auth, Firestore)
- **jsPDF** - PDF generation
