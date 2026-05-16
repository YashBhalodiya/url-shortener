# URL Shortener (Node.js)

A simple and scalable **URL Shortener** built using Node.js and Express that converts long URLs into short, shareable links. This project demonstrates core backend development concepts like routing, database design, redirection, and caching.

---

## Features

* Shorten long URLs into compact links
* Redirect short URLs to original URLs
* Track number of clicks (analytics)
* Store URL history
* Custom short URLs (optional)
* URL expiration support (optional)
* Fast redirection using caching

---

## Tech Stack

### Backend
- Node.js
- Express.js

### Frontend
- React (Vite)
- Tailwind CSS

### Database
- MongoDB

### Tools
- ESLint

---

## Project Structure

```
.
├── backend/
│   ├── config/        # DB config, environment setup
│   ├── controller/    # Business logic
│   ├── model/         # Database schemas
│   ├── routes/        # API routes
│   ├── tests/         # Backend test cases
│   ├── index.js       # Entry point
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/        # Static assets
│   ├── src/           # React/Vite source code
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
│
├── .gitignore
└── README.md
```

---

## API Endpoints

### 1. Shorten URL

```
POST /url
```

**Request Body:**

```json
{
  "url": "https://example.com/very-long-url"
}
```

**Response:**

```json
{
  "shortUrl": "http://localhost:8001/abc123"
}
```

---

### 2. Redirect URL

```
GET /:shortId
```

Redirects to the original URL.

---

## How It Works

1. User submits a long URL
2. Server generates a unique short code
3. URL and short code are stored in the database
4. When the short URL is accessed, the server looks up the original URL
5. User is redirected to the original link

---

## Future Improvements

* Advanced analytics dashboard
* Geo-location tracking
* QR code generation
* Rate limiting & security enhancements
* Deployment with custom domain
