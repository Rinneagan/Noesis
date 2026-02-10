# Class Attendance System

A modern, feature-rich class attendance tracking system built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Class Management**: Create, edit, and manage classes with student enrollment
- **Attendance Tracking**: Take attendance with present/absent/late status tracking
- **Student Management**: Add, remove, and manage student information
- **Real-time Updates**: Live attendance status with instant feedback

### Advanced Features
- **📊 Visual Analytics**: Interactive charts and graphs for attendance insights
- **🔍 Search & Filtering**: Global search across classes, students, and attendance records
- **📥 Export Functionality**: Export data to CSV and JSON formats
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📱 PWA Support**: Install as a mobile app with offline capabilities
- **⚡ Bulk Operations**: Mark all students present/absent/late with one click
- **📋 QR Code Check-in**: Generate QR codes for student self-check-in (placeholder)

### Technical Features
- **State Management**: Zustand for centralized state with local storage persistence
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first responsive layout
- **API Routes**: RESTful API for backend integration
- **Performance**: Optimized with React hooks and memoization

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS with dark mode support and system fonts
- **State Management**: Zustand with persistence
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **PWA**: Service Worker and Web App Manifest

## 📦 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── AttendanceCharts.tsx
│   ├── AttendanceReports.tsx
│   ├── AttendanceTracker.tsx
│   ├── ClassList.tsx
│   └── QRCodeCheckIn.tsx
├── lib/                   # Utilities and configuration
│   ├── data.ts           # Mock data
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Utility functions
└── types/                 # TypeScript type definitions
    └── index.ts
```

## 📊 Features Overview

### Classes Tab
- View all classes with student counts
- Add new classes with descriptions
- Manage student enrollment
- Export class lists to CSV

### Take Attendance Tab
- Select class and start attendance session
- Bulk attendance operations (mark all present/absent/late)
- Individual student attendance tracking
- Export current session data

### Reports Tab
- Advanced filtering by class and date range
- Student attendance summaries
- Class performance metrics
- Export reports in multiple formats

### Analytics Tab
- Visual attendance distribution charts
- Class comparison analytics
- Attendance trend analysis
- Statistical summaries

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific configuration.

### API Integration
The app includes mock API routes in `src/app/api/`. In production, replace these with your actual backend endpoints.

## 📱 PWA Features

- **Offline Support**: Service worker caching for offline functionality
- **Installable**: Can be installed as a mobile app
- **Responsive**: Optimized for all screen sizes

## 🎨 Customization

### Dark Mode
The app supports system dark mode preference and manual toggle.

### Themes
Colors and styling can be customized in `tailwind.config.ts`.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
npm run start
```

Deploy to Vercel for automatic optimization and CDN.

### Other Platforms
The app can be deployed to any platform supporting Next.js applications.

## 📈 Performance

- **Bundle Optimization**: Code splitting and lazy loading
- **Caching**: Service worker for offline access
- **Optimized Images**: Next.js Image optimization
- **Fast Refresh**: Development hot reloading

## 🔮 Future Enhancements

- Real database integration (PostgreSQL/MongoDB)
- Real-time collaboration with WebSockets
- Advanced analytics with machine learning
- Mobile app (React Native)
- Integration with calendar systems
- Email notifications for attendance alerts

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and modern web technologies.
