# Database & Infrastructure Documentation

This document outlines the data architecture, automation workflows, and administrative tools used in the Affective Learning Engine.

## 🏗 Database Architecture

The project uses a containerized **PostgreSQL** database managed via Docker Compose. 

### Infrastructure Components
- **postgres**: The core database engine (PostgreSQL 15).
- **pgadmin**: A management interface pre-configured with automatic server discovery.
- **tmpfs**: Used for pgAdmin storage to ensure a clean, zero-config state on every restart.

## 🔍 Accessing the Data

| Feature | Prisma Studio | pgAdmin 4 |
| :--- | :--- | :--- |
| **Primary Use** | Rapid data browsing / Quick edits | DB Administration / SQL Analysis |
| **Access** | `npx prisma studio` | [http://localhost:5050](http://localhost:5050) |
| **Interface** | Modern, Web-like Spreadsheet | Professional DB Management Tool |
| **Web Login** | None (Local only) | Email: `admin@admin.com` / Pass: `admin` |
| **Type Safety** | High (mapped to TS types) | Standard SQL |

### 🔑 Connection Credentials

To connect to the PostgreSQL server (either via pgAdmin or external tools), use:

> **Database Connection**
> - **Host**: `postgres` (internal Docker) or `localhost` (external)
> - **Port**: `5432`
> - **Username**: `user`
> - **Password**: `password`

**Pro-Tip:** These credentials match the local Docker environment and are pre-configured in `pgadmin/servers.json` for automatic discovery.

### pgAdmin Auto-Discovery
The `pgadmin` container is configured to automatically detect and connect to the `postgres` service using the `pgadmin/servers.json` configuration file. Credentials are pre-injected for a seamless developer experience.

## 🤖 Automation Commands

The following commands are available via `npm run`:

- `db:clean-audio`: Deletes the `public/audio/questions` directory to remove stale assets.
- `db:reset`: Wipes the database and reapplies the Prisma schema. **Warning: Irreversible data loss.**
- `db:seed`: populates the database with questions and generates unique slugs.
- `seed:admin`: Creates or updates the primary `admin` user with expert biometric baselines.
- `audio:generate`: Evaluates all Listening questions and generates missing MP3 files using Microsoft Edge TTS.
- **`setup`**: The master command that runs all the above in the correct order.

## 🧠 Biometric Data Structure

The `User` model includes specific fields to store affective baselines:

- `frownBase`: The neutral threshold for brow contraction.
- `frownMax`: The maximum intensity recorded for negative/concentrated states.
- `smileMax`: The maximum intensity recorded for positive/engaged states.
- `onboardingCompleted`: Boolean flag indicating if the calibration phase is finished.

## 🛠 Troubleshooting

### Docker Connection Issues
If pgAdmin cannot connect to the database:
1. Ensure both containers are running: `docker ps`.
2. Check logs for errors: `docker logs pgadmin_container`.
3. If the "English Quiz DB" server is missing, run `docker compose up -d --force-recreate` to refresh the `tmpfs` storage.
4. **Password Mismatch:** If pgAdmin asks for a password and it's not being accepted, verify that the `POSTGRES_PASSWORD` in the `docker-compose.yml` matches `password`.

### Prisma Sync
If the database schema seems out of sync with the code:
1. Run `npx prisma generate` to refresh the client.
2. Run `npm run db:reset` to re-align the physical database with the `schema.prisma` definition.
