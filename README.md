# 🚀 Start Page Dashboard

A modern, customizable browser start page with category-based organization, service monitoring, weather, traffic information, and an admin interface.

![Dashboard Preview](https://via.placeholder.com/800x400/0f0f1a/6366f1?text=Start+Page+Dashboard)

## ✨ Features

- 🎨 **20 Beautiful Themes** - Choose from Midnight Dark, Ocean Blue, Forest Green, Cyberpunk, Dracula, Nord, and more
- 📂 **Categorized Blocks** - Organize your links by category
- 🔤 **Alphabetical Sorting** - Blocks automatically sorted within each category
- 🖼️ **Custom Icons** - Support for custom images or auto-fetched favicons
- 📊 **Service Monitoring** - Monitor the health of your self-hosted services
- 🌤️ **Weather Display** - Show current weather with location search
- 🚗 **Traffic Information** - Real-time commute times with color-coded status
- ⚙️ **General Settings** - Customize site title, favicon, and theme
- 🔐 **Security** - 2FA/TOTP support, session management, rate limiting
- ⚡ **Admin Interface** - Web UI to manage all settings
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- ⌨️ **Keyboard Shortcuts** - Ctrl+K to focus search
- 📱 **Responsive** - Works on all devices

## 🚀 Quick Start

### Using Docker Compose (Recommended)

The easiest way to run Start Page Dashboard is using the pre-built Docker image from Docker Hub.

1. Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  startpage:
    image: twlatx/startpage-dashboard:latest
    container_name: startpage-dashboard
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
      - NEXT_PUBLIC_APP_NAME=Start Page Dashboard
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

2. Start the application:
```bash
docker-compose up -d
```

3. Open http://localhost:3000 in your browser

4. Access the admin panel at http://localhost:3000/admin

### Building from Source

If you prefer to build the Docker image yourself:

1. Clone the repository:
```bash
git clone <repository-url>
cd startpage-dashboard
```

2. Build and start the application:
```bash
docker-compose up -d --build
```

### Development

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## 📁 Project Structure

```
startpage-dashboard/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin interface
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main dashboard
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── docker-compose.yml    # Docker Compose config
├── Dockerfile            # Docker image
└── README.md             # This file
```

## 🔧 Configuration

### Adding Blocks

Visit `/admin` to manage blocks and categories through the web interface.

### Service Monitoring

When adding a block, you can enable monitoring by:
1. Checking "Is Monitored"
2. Providing a health check URL
3. The dashboard will show a status indicator

### Weather Integration

1. Go to Admin → Integrations tab
2. Enable Weather Display
3. Search for your location or enter coordinates manually
4. Choose metric or imperial units

### Traffic Information

1. Go to Admin → Traffic tab
2. Enable Traffic Display
3. Enter your [Google Routes API key](https://developers.google.com/maps/documentation/routes/get-api-key)
4. Set your Home and Work addresses
5. Select your preferred travel mode (Drive, Transit, Bicycle, Walk, Two Wheeler)
6. Choose metric or imperial units

**Note:** Google Routes API includes a free tier of 10,000 requests per month. The app caches results for 30 minutes and only fetches when the tab is active to minimize API usage.

### Custom Icons

You can provide custom icon URLs when creating blocks. If no icon is provided, the dashboard will automatically fetch the website's favicon.

### General Settings

Customize your dashboard appearance:
- **Site Title** - Change the browser tab title
- **Favicon** - Upload a custom favicon (SVG format supported)
- **Theme** - Choose from 20 beautiful color themes:
  - Midnight Dark (default)
  - Ocean Blue
  - Forest Green
  - Sunset Orange
  - Sakura Pink
  - Cyberpunk
  - Monokai
  - Dracula
  - Nord
  - Solarized Dark
  - Gruvbox Dark
  - Tokyo Night
  - One Dark
  - Catppuccin Mocha
  - Rosé Pine
  - Material Dark
  - High Contrast
  - Coffee
  - Lavender
  - Crimson

## 🔐 Security Features

- **Two-Factor Authentication (2FA)** - TOTP-based 2FA support
- **Session Management** - View and revoke active sessions
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - X-Frame-Options, CSP, HSTS, and more
- **Dashboard Protection** - Optional password protection for the dashboard

### Resetting a Forgotten Admin Password

If you forget your admin password, you can reset it via the command line. This requires direct access to the server running the application.

**Local Development:**

```bash
DATABASE_URL=file:./data/dev.db npm run admin:reset-password
```

**Docker:**

```bash
docker exec -it startpage-dashboard node scripts/reset-admin-password.js
```

The script will list available users, prompt for a new password (with hidden input), and invalidate all existing sessions. You can also pass `--clear-totp` to disable 2FA if you've lost access to your authenticator app:

```bash
docker exec -it startpage-dashboard node scripts/reset-admin-password.js --clear-totp
```

## 🔌 API Endpoints

### Categories & Blocks
- `GET /api/categories` - List all categories with blocks
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

- `GET /api/blocks` - List all blocks
- `POST /api/blocks` - Create a new block
- `PUT /api/blocks/:id` - Update a block
- `DELETE /api/blocks/:id` - Delete a block

### Settings
- `GET /api/settings` - Get general settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/general` - Get site title and favicon
- `PUT /api/settings/general` - Update site title and favicon
- `GET /api/settings/traffic` - Get traffic settings
- `PUT /api/settings/traffic` - Update traffic settings

### Data
- `GET /api/weather` - Get current weather
- `GET /api/traffic` - Get traffic information (with caching)
- `GET /api/health/:id` - Check service health

## 🐳 Docker Deployment

### Using Pre-built Image (Recommended)

Pull and run the official image from Docker Hub:

```bash
# Pull the latest image
docker pull twlatx/startpage-dashboard:latest

# Run with docker run
docker run -d \
  --name startpage-dashboard \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_NAME="Start Page Dashboard" \
  --restart unless-stopped \
  twlatx/startpage-dashboard:latest
```

### Building from Source

```bash
docker-compose up -d --build
```

### View logs:
```bash
docker-compose logs -f
```

### Stop:
```bash
docker-compose down
```

### Data persistence:
The SQLite database is stored in `./data/prod.db` and persisted through Docker volumes.

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Prisma](https://prisma.io/) - Database ORM
- [SQLite](https://sqlite.org/) - Database
- [Lucide React](https://lucide.dev/) - Icons
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing
- [rate-limiter-flexible](https://www.npmjs.com/package/rate-limiter-flexible) - Rate limiting

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.
