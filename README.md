# Py-Gram 2k25 🎓

A sophisticated academic timetable generation system built with modern web technologies. Features a hybrid CSP + Genetic Algorithm approach for optimal schedule creation with real-time conflict detection.

![Project Screenshot](https://via.placeholder.com/800x400/2563eb/ffffff?text=Py-Gram+2025+Timetable+System)

## 🌟 Features

### Core Functionality
- **Intelligent Timetable Generation**: Hybrid CSP + GA algorithm for optimal scheduling
- **Real-time Conflict Detection**: Automatic detection of faculty, classroom, and batch conflicts
- **Quality Scoring**: Algorithmic assessment of schedule optimality
- **Interactive Timetable Grid**: Visual representation with drag-drop potential
- **Academic Entity Management**: Faculty, subjects, classrooms, and student batches
- **🚨 Emergency Holiday Declaration**: Multi-channel notification system for institutional closures
- **Indian Holiday Calendar**: Pre-loaded with 30+ Indian national and festival holidays for 2025
- **Event Management**: Comprehensive event scheduling with conflict detection and queue system

### Technical Highlights
- **Modern React 18** with TypeScript
- **Supabase Integration** for real-time database operations
- **Redux Toolkit** with RTK Query for state management
- **Responsive Design** with TailwindCSS 3
- **Component Library** based on Radix UI primitives
- **Full-stack Architecture** with Express server integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PNPM (recommended) or npm
- Supabase account (optional, uses mock data by default)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mayuraglawe/PyGram_2025.git
   cd PyGram_2025
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🏗️ Architecture

### Frontend Structure
```
client/
├── pages/              # Route components
├── components/         
│   ├── ui/            # Reusable UI components
│   ├── layout/        # Layout components
│   └── auth/          # Authentication components
├── features/          # Feature-based modules
│   ├── auth/          # Authentication logic
│   └── timetable/     # Timetable-specific components
├── store/             # Redux store and API layer
└── hooks/             # Custom React hooks
```

### Backend Structure
```
server/
├── index.ts           # Express server setup
├── routes/            # API route handlers
└── node-build.ts      # Production server entry

shared/
├── api.ts             # Shared type definitions
└── supabase.ts        # Database client configuration
```

## 📊 Database Schema

The system uses a normalized PostgreSQL schema with the following entities:

- **Faculty**: Teachers and instructors
- **Subjects**: Academic courses with credit and lab requirements
- **Classrooms**: Physical spaces with capacity and equipment specs
- **Student Batches**: Class groups with enrollment data
- **Time Slots**: Scheduled periods throughout the week
- **Timetables**: Generated schedules with quality metrics
- **Scheduled Classes**: Individual class assignments

### Database Setup

1. Create a new Supabase project
2. Run the schema migration:
   ```sql
   -- Copy and paste from database/schema.sql
   ```
3. Optionally add sample data:
   ```sql
   -- Copy and paste from database/sample-data.sql
   ```

## 🎯 Key Components

### Timetable Generation
- **Algorithm**: Two-phase approach combining constraint satisfaction with genetic optimization
- **Constraints**: Hard constraints (conflicts) and soft constraints (preferences)
- **Quality Metrics**: Automated scoring based on various optimization criteria

### Conflict Detection
```typescript
// Real-time conflict detection
const conflicts = findConflicts(scheduledClasses);
// Highlights conflicts across faculty, batches, and classrooms
```

### State Management
```typescript
// RTK Query for API operations
const { data: faculty } = useGetFacultyQuery();
const [addFaculty] = useAddFacultyMutation();
```

## 🚀 Deployment

### Development
```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Start production server
```

### Production Options

#### Netlify (Recommended)
- Automatic deployment from GitHub
- Serverless functions for API
- Pre-configured in `netlify.toml`

#### Manual Deployment
```bash
pnpm build
# Deploy dist/spa to your static hosting
# Deploy server build for API functionality
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS 3** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Redux Toolkit** - Predictable state management
- **React Router 6** - Client-side routing

### Backend
- **Express** - Web application framework
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **TypeScript** - End-to-end type safety

### Development Tools
- **PNPM** - Fast, disk space efficient package manager
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Vitest** - Unit testing framework

## 📱 Features in Detail

### Dashboard
- Overview of academic entities
- System architecture information
- Quick access to main functions

### Entity Management
- **Faculty**: Add/edit teacher information and assignments
- **Subjects**: Manage courses with credit and lab requirements
- **Classrooms**: Track room capacity and equipment
- **Batches**: Organize student groups and subject assignments

### Timetable Operations
- **Generation**: Create optimized schedules using advanced algorithms
- **Visualization**: Interactive grid showing class assignments
- **Conflict Resolution**: Real-time detection and highlighting
- **Quality Assessment**: Automatic scoring of schedule efficiency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

- [ ] Advanced scheduling constraints
- [ ] Export to PDF/Excel
- [ ] Multi-semester planning
- [ ] Teacher preference management
- [ ] Room booking integration
- [ ] Mobile application

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mayur Aglawe**
- GitHub: [@Mayuraglawe](https://github.com/Mayuraglawe)
- Project: [PyGram_2025](https://github.com/Mayuraglawe/PyGram_2025)

## 🙏 Acknowledgments

- Built with the [Fusion Starter](https://github.com/fusion-starter) template
- UI components based on [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)

---

⭐ **Star this repository if you find it helpful!**