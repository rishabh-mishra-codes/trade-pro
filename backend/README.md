# TradePro Backend (Spring Boot + PostgreSQL)

Replaces Appwrite with a Java Spring Boot API for authentication and user
profiles, backed by a free online PostgreSQL database (Neon).

## What it provides

REST API consumed by the React frontend:

| Method | Path                        | Auth | Purpose                          |
|--------|-----------------------------|------|----------------------------------|
| POST   | `/api/auth/register`        | no   | Create account, returns JWT+user |
| POST   | `/api/auth/login`           | no   | Log in, returns JWT+user         |
| GET    | `/api/auth/me`              | yes  | Current user profile             |
| POST   | `/api/auth/forgot-password` | no   | Generate reset token             |
| POST   | `/api/auth/reset-password`  | no   | Reset password with token        |
| POST   | `/api/payments/create-order`| yes  | Create Razorpay order            |
| POST   | `/api/payments/verify`      | yes  | Verify Razorpay signature        |
| GET    | `/api/market/search?q=`     | yes  | Search NSE stock universe        |
| GET/POST/DELETE | `/api/watchlist`   | yes  | Manage watchlist                 |
| GET    | `/api/orders`               | yes  | Order history                    |
| POST   | `/api/orders/limit`         | yes  | Place a limit order              |
| DELETE | `/api/orders/{id}`          | yes  | Cancel a pending order           |
| GET/POST/DELETE | `/api/alerts`      | yes  | Manage price alerts              |
| PUT    | `/api/profile/theme`        | yes  | Persist dark/light theme         |
| POST   | `/api/chat`                 | yes  | AI assistant (Gemini) grounded in your portfolio |

The AI chatbot uses Google Gemini. Set `app.gemini.api-key` (server-side only).
It injects the user's live holdings, cash, and P&L into the prompt so it can
answer "what's my P&L", "how much cash", "what is Reliance trading at", etc.

A background scheduler checks price alerts every 60s against live prices
(needs `app.twelvedata.api-key`).

### Razorpay & password reset notes

- Razorpay **secret** stays server-side only (in `application-local.properties`
  / env vars). The frontend uses only the public `key_id`.
- `app.expose-reset-token=true` (dev) makes `/forgot-password` return the reset
  token in the response so you can test without email. Set `false` in
  production and wire up an email sender to deliver the token instead.

The JWT is stored in the browser's localStorage by the frontend and sent as
`Authorization: Bearer <token>`.

---

## 1. Prerequisites

- **JDK 24** — https://adoptium.net (Temurin 24) or https://jdk.java.net/24.
  Verify: `java -version` (should report 24). Spring Boot 3.4.x supports it.
- **Maven 3.9+** — https://maven.apache.org/download.cgi (or `choco install maven`
  / `winget install Apache.Maven`). Verify: `mvn -version`

---

## 2. Get a FREE online SQL database (Neon PostgreSQL)

Neon is free-forever with 0.5 GB storage, always online.

1. Go to https://neon.tech and sign up (GitHub/Google login works).
2. Click **Create Project**. Pick a name and a region close to you.
3. After it's created, open the **Dashboard** -> **Connection Details**.
4. You'll see a connection string like:
   ```
   postgresql://alex:AbC123@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Split it into the three values Spring Boot needs:
   - **Username** = the part before `:` (e.g. `alex`)
   - **Password** = the part between `:` and `@` (e.g. `AbC123`)
   - **JDBC URL** = `jdbc:postgresql://` + everything after the `@`, e.g.
     ```
     jdbc:postgresql://ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   (Just add the `jdbc:` prefix and drop the `user:pass@` portion.)

> Prefer Supabase instead? Create a project at https://supabase.com, then go to
> Project Settings -> Database -> Connection string (URI). Convert it the same
> way (add `jdbc:` prefix, move user/pass into DB_USERNAME/DB_PASSWORD).

---

## 3. Configure credentials

For local dev, your Neon credentials live in
`src/main/resources/application-local.properties` (already created and
**gitignored** so it is never committed). Update the values there if your
Neon password changes.

For deployment, set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, and
`CORS_ORIGINS` as environment variables instead (see `.env.example`).

---

## 4. Run the backend

Run with the `local` profile so it picks up your credentials. The Maven
wrapper (`mvnw`) downloads Maven automatically, so you only need JDK 21:

```cmd
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

(macOS/Linux: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`)

First run downloads dependencies and Hibernate auto-creates the
`user_accounts` table (`spring.jpa.hibernate.ddl-auto=update`).

The API starts on http://localhost:8080. Quick test:

```cmd
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"fullName\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

You should get back a JSON object with a `token` and `user`.

---

## 5. Point the frontend at it

The frontend already reads `VITE_API_URL` from `../.env` (defaults to
`http://localhost:8080/api`). Start the frontend as usual:

```cmd
npm install
npm run dev
```

Register a new account in the UI, then log in.

---

## Notes / production

- Change `JWT_SECRET` to a long random value and keep it out of git.
- Passwords are hashed with BCrypt; plaintext is never stored.
- To deploy, services like Railway, Render, or Fly.io can host the jar
  (`mvn clean package` produces `target/tradepro-backend-0.0.1-SNAPSHOT.jar`).
  Set the same env vars there, and update `CORS_ORIGINS` to your deployed
  frontend URL.
