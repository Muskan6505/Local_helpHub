# Local HelpHub

Local HelpHub is a location-aware mutual-aid platform. People can publish nearby requests for help, discover requests using map and distance filters, respond as helpers, and communicate through request-scoped real-time chat.

The repository contains two applications:

- `Backend`: an Express 5 API backed by MongoDB, with JWT authentication, Cloudinary uploads, Gemini tag generation, and Socket.IO chat.
- `Frontend`: a React 19 single-page application built with Vite, Redux Toolkit, React Router, Leaflet, and Google Maps integrations.

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Running the application](#running-the-application)
- [Application routes](#application-routes)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Authentication](#authentication)
- [Real-time chat](#real-time-chat)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Validation](#validation)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

## Capabilities

### Accounts and profiles

- Register and log in with an email address and password.
- Maintain a profile with a display name, contact details, biography, avatar, and location.
- Update or remove an avatar through Cloudinary-backed uploads.
- Change the account password, refresh an access session, log out, or delete the account.
- Store user locations as GeoJSON points for nearby searches.

### Help requests

- Create a request with a title, description, category, priority, and location.
- Generate request tags using Google Gemini.
- Browse request details and a request feed.
- Search and filter by keyword, category, status, priority, date, and radius.
- Edit and delete requests owned by the current user.
- View requests near a supplied latitude and longitude.

### Responses and coordination

- Respond to a help request with a message.
- View responses associated with a request and responses submitted by the current user.
- Request owners can accept or decline helpers.
- Accepted responses expose contact details needed to coordinate help.

### Messaging and location

- Chat is scoped to a request and its participants.
- Message history is persisted by the API.
- Socket.IO provides live messages, typing indicators, online presence, delivery, and seen state events.
- Leaflet and Google Maps components support maps, browser geolocation, location picking, reverse geocoding, and directions.

### Notifications and SOS

Notification and SOS pages/routes are present in the frontend, but they are currently placeholders. The notification model exists in the backend, while notification routes are not mounted in the API.

## Architecture

```text
Browser (React/Vite)
  |-- /api requests with credentials
  v
Express API :8000 ---- MongoDB
  |                    |-- users
  |                    |-- help requests
  |                    |-- responses
  |                    `-- messages
  |
  |-- Cloudinary for avatar media
  |-- Gemini for generated request tags
  `-- Socket.IO server :5000 for chat
```

In development, Vite proxies `/api` to `http://localhost:8000`. The frontend Socket.IO client currently connects directly to `http://localhost:5000`, independently of the Vite proxy.

## Prerequisites

- Node.js with npm.
- A MongoDB database, local or hosted.
- A Cloudinary account for avatar uploads.
- A Google Gemini API key for automatic request tags.
- A Google Maps API key for Google Maps features.
- A browser with location access if using geolocation features.

## Local setup

Clone the repository, then install dependencies independently for each application:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

Create `Backend/.env` from `Backend/.env.sample` and fill in the required values. The sample does not currently include every variable used by the application; see [Environment variables](#environment-variables) below.

The frontend reads `VITE_GOOGLE_MAPS_API_KEY` at build time. Put it in `Frontend/.env` before starting Vite:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Do not commit either `.env` file or any secret values.

## Environment variables

### Backend: `Backend/.env`

| Variable | Purpose | Typical local value |
| --- | --- | --- |
| `PORT` | Express API port | `8000` |
| `CHATPORT` | Socket.IO HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/local_help_hub` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | Access JWT signing secret | Long random string |
| `ACCESS_TOKEN_EXPIRY` | Access JWT lifetime | `1d` |
| `REFRESH_TOKEN_SECRET` | Refresh JWT signing secret | Long random string |
| `REFRESH_TOKEN_EXPIRY` | Refresh JWT lifetime | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Provider value |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Provider value |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Provider value |
| `GEMINI_API_KEY` | Gemini tag-generation key | Google AI value |

`CORS_ORIGIN` should be a specific trusted origin outside local development. The existing sample uses `*`, which is incompatible with credentialed browser requests in many deployments.

### Frontend: `Frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

The frontend API base URL is not currently configurable. Local API calls rely on the Vite proxy, and the Socket.IO URL is hard-coded to `http://localhost:5000` in `Frontend/src/utils/socket.js`.

## Running the application

Start the backend in one terminal:

```bash
cd Backend
npm run dev
```

This starts the Express API on `http://localhost:8000` and the Socket.IO server on `http://localhost:5000` by default. The backend development script uses Nodemon and preloads dotenv.

Start the frontend in another terminal:

```bash
cd Frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Available frontend scripts:

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build in dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

Available backend scripts:

```bash
npm run dev       # Start the API and Socket.IO with Nodemon
npm start         # Start the Vercel-oriented API entrypoint
```

## Application routes

The frontend routes are defined in `Frontend/src/App.jsx`.

### Public routes

| Route | Screen |
| --- | --- |
| `/` | Welcome page |
| `/login` | Login |
| `/signup` | Registration |
| `*` | Not found |

### Authenticated routes

| Route | Screen |
| --- | --- |
| `/dashboard` | Dashboard and nearby request overview |
| `/profile` | Profile management |
| `/requests` | Request feed |
| `/myrequests` | Current user's requests and responses |
| `/requests/create` | Create a request |
| `/requests/:id` | Request detail |
| `/edit-request/:id` | Edit a request |
| `/chat/:receiverId/:requestId` | Request-scoped chat |
| `/sos` | SOS placeholder |
| `/notifications` | Notifications placeholder |

Unauthenticated visitors are redirected to `/`. On application startup, the frontend calls the refresh endpoint with credentials and restores the Redux user state when a valid refresh cookie exists.

## API reference

The API prefix is `/api/v1`. Requests that modify or retrieve user data require JWT authentication unless noted otherwise. Authentication can be supplied by the `accessToken` cookie or an `Authorization: Bearer <token>` header.

### Users: `/api/v1/users`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | No | Create an account |
| `POST` | `/login` | No | Authenticate and issue tokens |
| `POST` | `/refresh` | No | Refresh the access session |
| `POST` | `/logout` | Yes | Clear the session |
| `PATCH` | `/update` | Yes | Update profile fields |
| `DELETE` | `/` | Yes | Delete the current account |
| `PATCH` | `/avatar/update` | Yes | Upload or replace an avatar |
| `DELETE` | `/avatar` | Yes | Remove the avatar |
| `PATCH` | `/password/change` | Yes | Change the password |
| `GET` | `/` | Yes | Get the current user |
| `GET` | `/:userId` | Yes | Get another user by ID |

### Help requests: `/api/v1/help-requests`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/` | Yes | Create a help request |
| `GET` | `/` | Yes | List help requests |
| `GET` | `/filter/query` | Yes | Query filtered or nearby requests |
| `GET` | `/:id` | Yes | Get one request |
| `PUT` | `/:id` | Yes | Update an owned request |
| `DELETE` | `/:id` | Yes | Delete an owned request |

The filter endpoint supports the request-feed filters implemented by the controller, including keyword, category, status, priority, date, radius, latitude, and longitude. Consult `Backend/src/controllers/helpRequest.controller.js` for the accepted query field names and response shape when integrating another client.

### Responses: `/api/v1/responses`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/new` | Yes | Submit a response to a request |
| `GET` | `/` | Yes | List responses for the current user |
| `GET` | `/:helpRequest` | Yes | List responses for a request |
| `PATCH` | `/:responseId` | Yes | Accept or decline a response |
| `GET` | `/check/:helpRequestId` | Yes | Check whether the current user responded |

Response statuses are `Pending`, `Accepted`, and `Declined`.

### Messages: `/api/v1/messages`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/:requestId` | Yes | Load request-scoped message history |
| `GET` | `/unread/count` | Yes | Get unread message count |

Socket.IO handles live chat events in addition to these REST endpoints.

## Data model

- **User**: name, unique email, bcrypt-hashed password, avatar, GeoJSON location, contact information, biography, trust score, refresh token, and a `2dsphere` location index.
- **HelpRequest**: title, description, category, generated tags, GeoJSON location, requester reference, status, priority, timestamps, and a `2dsphere` location index.
- **Response**: helper reference, help-request reference, message, and status (`Pending`, `Accepted`, or `Declined`).
- **Message**: sender, receiver, request ID, text, delivered flag, seen flag, and timestamps.
- **Notification**: user, notification type, content, and read state. This model is not currently exposed through mounted routes.

MongoDB is required because the application uses Mongoose models and geospatial indexes for location-aware features.

## Authentication

The backend uses access and refresh JWTs. Login and refresh set cookies used by credentialed frontend requests. The auth middleware checks the `accessToken` cookie first and also supports a bearer token in the `Authorization` header.

For local development, the frontend sends cookies through Axios requests. The backend CORS configuration enables credentials and should match the exact frontend origin.

## Real-time chat

The backend creates a separate HTTP server for Socket.IO. By default:

- API: `http://localhost:8000`
- Socket.IO: `http://localhost:5000`

The client connection is currently hard-coded to the localhost Socket.IO address. This works only when the local socket server is running and must be changed or externalized before production deployment. The Vercel API handler in `Backend/api/index.js` exposes Express only and does not initialize Socket.IO.

## Deployment

### Frontend on Netlify

`Frontend/netlify.toml` configures:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback from `/*` to `/index.html`

Set `VITE_GOOGLE_MAPS_API_KEY` in the Netlify environment. The current `/api/*` redirect points to a localhost address and is not a production backend configuration; replace it with the deployed API URL before deploying.

### Backend on Vercel

`Backend/api/index.js` adapts the Express app to a Vercel function. The repository configuration file is named `Backend/vecrcel.json`; Vercel normally expects `vercel.json`, so verify or rename this file as part of deployment configuration.

The Vercel handler does not start the Socket.IO server. Deploy chat separately on a long-running server or use a managed real-time service, then configure the frontend client to use that public socket URL.

Before any production deployment:

1. Set all backend secrets in the hosting provider's environment settings.
2. Set `CORS_ORIGIN` to the deployed frontend origin.
3. Replace localhost API and socket URLs.
4. Restrict Google Maps key usage by domain and API.
5. Confirm MongoDB network access and Cloudinary/Gemini quotas.
6. Test login, refresh, uploads, geospatial searches, responses, and chat in the deployed environment.

## Project structure

```text
Local_helpHub/
|-- Backend/
|   |-- api/index.js                 Vercel adapter
|   |-- src/index.js                 Local API and Socket.IO startup
|   |-- src/app.js                   Express middleware and route mounting
|   |-- src/controllers/             Request handlers
|   |-- src/db/                      MongoDB connection
|   |-- src/middlewares/             JWT and upload middleware
|   |-- src/models/                  Mongoose schemas
|   |-- src/routes/                  API routers
|   `-- src/utils/                   Errors, responses, Cloudinary, Gemini, Socket.IO
|-- Frontend/
|   |-- src/App.jsx                  Router and session restoration
|   |-- src/components/              Shared UI, maps, navigation, and request cards
|   |-- src/features/userSlice.js    Redux authentication state
|   |-- src/layout/Authenticated.jsx Protected-route guard
|   |-- src/pages/                   Application screens
|   |-- src/store/store.js            Redux store
|   `-- src/utils/socket.js           Socket.IO client
`-- README.md
```

## Validation

There is currently no automated test suite in the repository. The minimum local checks are:

```bash
cd Frontend
npm run lint
npm run build
```

Then run the backend and manually verify registration, login, refresh after reload, request creation, nearby filtering, response acceptance, avatar upload, and request chat. Backend behavior depends on live MongoDB and third-party services, so a successful frontend build does not validate those integrations.

## Troubleshooting

### API requests fail from the frontend

Confirm that the backend is running on port `8000`, the frontend is running through Vite, and the backend `CORS_ORIGIN` matches the frontend origin. Browser requests use credentials, so wildcard CORS is not a reliable production setting.

### Login succeeds but the session disappears

Confirm that cookies are enabled, the frontend and backend origins are configured correctly, and both JWT secrets and expiry values exist. Reloading the app depends on `POST /api/v1/users/refresh`.

### Maps do not render

Set `VITE_GOOGLE_MAPS_API_KEY` in `Frontend/.env`, restart Vite after changing it, and enable the required Google Maps APIs. Browser key restrictions must include the local or deployed frontend origin.

### Chat does not connect

Start the backend Socket.IO listener on port `5000` and confirm the browser can reach it. A deployed frontend cannot use the current localhost socket URL; it requires a separately deployed socket service and a configurable client URL.

### Nearby results are empty

Allow browser location access, confirm the stored coordinates are valid GeoJSON points, and verify that MongoDB supports the `2dsphere` indexes used by users and help requests.

## License and authorship

The backend package metadata identifies the author as Muskan Kumari and uses the ISC license. Review the package metadata and repository policy before redistributing the application.
