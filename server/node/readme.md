# Risuai Node Server

> Warning: Node server may be deprecated in future versions, replaced with [Hono](https://hono.dev/) based server which could run in multiple environments including nodejs, deno, and serverless platforms such as Cloudflare Workers, Vercel Edge Functions, etc.

This is the Node.js server for Risuai, for self-hosting purposes, who want to run Risuai on their own server remotely, without using official server for privacy or other reasons.

For a private single-user installation, `RISU_UNLIMITED_STORAGE=1` removes the
request-count limit from `/api/read`, `/api/write`, `/api/list`, and `/api/remove`.
These routes still require authentication. Login and proxy limits are unchanged.
Leave this variable unset to retain the default shared storage rate limit.
