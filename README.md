# PrimeTrade – Next.js Fullstack App

Single Next.js app — frontend pages + API routes in one repo. No separate backend server needed.

---

## Stack

- **Next.js 15** (App Router)
- **MongoDB** via Mongoose
- **JWT** for auth (7d expiry)
- **bcryptjs** for password hashing (salt rounds: 12)

---

## Project Structure

```
src/
├── app/
│   ├── api/                    ← API routes (backend)
│   │   ├── auth/
│   │   │   ├── register/route.js
│   │   │   ├── login/route.js
│   │   │   └── me/route.js
│   │   ├── tasks/
│   │   │   ├── route.js        ← GET all, POST create
│   │   │   └── [id]/route.js   ← GET one, PUT update, DELETE
│   │   └── admin/
│   │       ├── stats/route.js
│   │       └── users/
│   │           ├── route.js          ← GET all users
│   │           └── [id]/route.js     ← DELETE user, PATCH role
│   ├── login/page.js
│   ├── register/page.js
│   ├── dashboard/page.js       ← user task manager
│   └── admin/page.js           ← admin panel (role management)
├── lib/
│   ├── db.js                   ← mongoose connection (cached)
│   └── jwt.js                  ← sign/verify helpers
├── middleware/
│   └── auth.js                 ← requireAuth, requireAdmin
└── models/
    ├── User.js
    └── Task.js
```

---

## Setup

```bash
git clone <your-repo>
cd primetrade

cp .env.local.example .env.local
# edit .env.local — set MONGO_URI and JWT_SECRET

npm install
npm run dev
```

App: http://localhost:3000  
API: http://localhost:3000/api/...

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | none | Register new user |
| POST | /api/auth/login | none | Login, returns JWT |
| GET | /api/auth/me | JWT | Get current user |

### Tasks  *(JWT required — users only see their own tasks)*
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List tasks (filter: ?status=, ?priority=, ?page=, ?limit=) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Single task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Admin  *(admin role required)*
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/stats | Platform stats (users, tasks, pending, done) |
| GET | /api/admin/users | All users |
| DELETE | /api/admin/users/:id | Delete user + cascade-delete their tasks |
| PATCH | /api/admin/users/:id | Change user role (`{ "role": "admin" \| "user" }`) |

---

## Role-Based Access

Two roles: `user` (default) and `admin`.

| Feature | user | admin |
|---------|------|-------|
| Register / Login | ✅ | ✅ |
| Manage own tasks (CRUD) | ✅ | ✅ |
| View own tasks only | ✅ | ✅ |
| Admin panel | ❌ | ✅ |
| View all users | ❌ | ✅ |
| Platform stats | ❌ | ✅ |
| Delete other users | ❌ | ✅ |
| Promote/demote roles | ❌ | ✅ |

**How role enforcement works:**
- `requireAuth` middleware: validates JWT, attaches user to request
- `requireAdmin` middleware: calls requireAuth, then checks `user.role === 'admin'`, returns 403 otherwise
- Every admin API route calls `requireAdmin` before doing anything
- Frontend additionally redirects non-admins away from `/admin` page (client-side guard)

### Make the first admin via MongoDB shell:
```js
db.users.updateOne({ email: "you@email.com" }, { $set: { role: "admin" } })
```
After that, you can promote other users from the Admin Panel UI.

---

## Security

- Passwords hashed with bcrypt (12 rounds), never returned in responses
- JWT signed with secret from env — never hardcoded
- Email normalized to lowercase on save
- Input validation on all POST/PUT routes
- Users can only access their own tasks (filtered by `user: user._id`)
- Admins cannot delete or demote themselves

---

## Scalability Notes

**Stateless auth** — JWT means no server-side session store. Multiple Next.js instances behind a load balancer all work without shared state.

**DB connection pooling** — `connectDB()` caches the mongoose connection at module level. Next.js serverless functions reuse the same connection across warm invocations instead of reconnecting every request.

**Modular structure** — models, middleware, lib are split cleanly. Adding a new entity (e.g. `products`, `orders`) = new model + new `src/app/api/products/` folder. Nothing else changes.

**Redis caching** — `/api/admin/stats` and paginated task lists are prime candidates for a Redis layer (e.g. 60s TTL on stats). Would cut DB reads significantly under load.

**Horizontal scaling** — stateless design means the app can be deployed to multiple containers/lambdas. Mongoose connection pooling handles concurrent requests cleanly.

**Docker** — straightforward single Dockerfile since there's no separate server process:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

**Future: microservices** — auth, tasks, and admin are already logically separated in the folder structure. If scale demands it, each can be extracted to its own service with minimal refactoring.

---

## Environment Variables

```
MONGO_URI=mongodb://localhost:27017/primetrade
JWT_SECRET=some_long_random_secret_here
JWT_EXPIRES_IN=7d
```
