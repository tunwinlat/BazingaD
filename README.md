# 🚀 Start Page Dashboard

A modern, customizable browser start page with category-based organization, service monitoring, and an admin interface.

![Dashboard Preview](https://via.placeholder.com/800x400/0f0f1a/6366f1?text=Start+Page+Dashboard)

## ✨ Features

- 🎨 **Modern Glassmorphism Design** - Beautiful dark theme with animated gradients
- 📂 **Categorized Blocks** - Organize your links by category
- 🔤 **Alphabetical Sorting** - Blocks automatically sorted within each category
- 🖼️ **Custom Icons** - Support for custom images or auto-fetched favicons
- 📊 **Service Monitoring** - Monitor the health of your self-hosted services
- ⚡ **Admin Interface** - Web UI to manage blocks and categories
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

### Custom Icons

You can provide custom icon URLs when creating blocks. If no icon is provided, the dashboard will automatically fetch the website's favicon.

## 🔌 API Endpoints

- `GET /api/categories` - List all categories with blocks
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

- `GET /api/blocks` - List all blocks
- `POST /api/blocks` - Create a new block
- `PUT /api/blocks/:id` - Update a block
- `DELETE /api/blocks/:id` - Delete a block

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

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.
