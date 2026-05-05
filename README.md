# Affective Learning Engine

A specialized adaptive learning system developed for academic research in Affective Computing. The system analyzes real-time facial micro-expressions to adapt educational content based on the user's cognitive and emotional state.

## 🚀 Quick Start

To initialize the entire environment (database, admin user, and audio assets), run:

```bash
npm install
npm run setup
```

Then, start the development server:

```bash
npm run dev
```

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Docker
- **ORM:** Prisma
- **AI/Vision:** MediaPipe FaceLandmarker
- **TTS:** Microsoft Edge TTS (via `msedge-tts`)
- **Admin Tooling:** pgAdmin 4 & Prisma Studio

## 💻 Development Workflow

### Local Development
1. Ensure Docker is running.
2. Run `npm run dev` to start the Next.js application.
3. Access the application at [http://localhost:3000](http://localhost:3000).

### Database Management
You have two primary tools for interacting with the data:

1. **Prisma Studio**: Ideal for quick, type-safe data browsing and manual edits.
   - Command: `npx prisma studio`
   - Access: [http://localhost:5555](http://localhost:5555)
2. **pgAdmin 4**: For professional database administration, schema inspection, and SQL queries.
   - Access: [http://localhost:5050](http://localhost:5050)
   - **Web Login**: `admin@admin.com` / `admin`

> **Database Connection Credentials**
> - **Host**: `postgres`
> - **Port**: `5432`
> - **User**: `user`
> - **Password**: `password`
>
> **Note:** These credentials are pre-configured in `servers.json` for automatic discovery within pgAdmin.

### Master Setup
The `npm run setup` command is a sequential orchestrator that performs the following:
- Cleans existing audio assets.
- Resets the database schema.
- Seeds questions with descriptive slugs.
- Creates a pre-configured Admin user. (**username:** admin; **password**: admin123)
- Generates/links audio files using TTS.

For more details on infrastructure and data, see [README_DB.md](./README_DB.md).
