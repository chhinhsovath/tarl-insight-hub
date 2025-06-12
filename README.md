# TaRL Insight Hub

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/plp/v0-ta-rl-insight-hub)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/RT4GZv35DI4)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/plp/v0-ta-rl-insight-hub](https://vercel.com/plp/v0-ta-rl-insight-hub)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/RT4GZv35DI4](https://v0.dev/chat/projects/RT4GZv35DI4)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Database configuration

The application can connect to a MySQL database when the following environment variables are provided:

```
MYSQL_HOST=<host>
MYSQL_PORT=<port>
MYSQL_USER=<user>
MYSQL_PASSWORD=<password>
MYSQL_DATABASE=<database>
```

If these variables are not set, the app falls back to the built-in static demo data.

## API Endpoints

When running locally, the following routes expose database data:

- `/api/provinces` – list provinces
- `/api/districts?provinceId=<id>` – list districts (optionally filtered by province)
- `/api/schools?provinceId=<id>&districtId=<id>` – list schools and create new ones (POST)
- `/api/users` – list users and create new ones (POST)

These endpoints use MySQL when the environment variables above are provided.
