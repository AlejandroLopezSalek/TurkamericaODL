# Security & Cloudflare Setup Guide

This document outlines the steps to secure the TurkAmerica project, focusing on Cloudflare integration and general security best practices.

## 1. Cloudflare Configuration

Cloudflare acts as your first line of defense against DDoS attacks and malicious traffic.

### Phase 1: Basic Setup
1. **Account**: Create a free account at [cloudflare.com](https://www.cloudflare.com).
2. **Add Site**: Enter your domain (e.g., `turkamerica.com`).
3. **DNS Scann**: Cloudflare will scan your existing DNS records. Ensure your `A` or `CNAME` records for the main domain and `www` are found.
4. **Change Nameservers**: Login to your domain registrar (GoDaddy, Namecheap, etc.) and replace their nameservers with the ones provided by Cloudflare.

### Phase 2: Security Hardening
- **Proxy Status**: Ensure the "Orange Cloud" icon is ON for your main DNS records. This hides your server's IP.
- **SSL/TLS**: Set to **"Full"** or **"Full (Strict)"**. This ensures encryption between Cloudflare and your server.
- **Edge Certificates**: Turn on **"Always Use HTTPS"** and **"Automatic HTTPS Rewrites"**.
- **WAF (Web Application Firewall)**:
    - Create a rule to block or challenge traffic from high-risk countries if your target audience is specific to Latam/Turkey.
    - Enable **"Bot Fight Mode"** (Free tier).

---

## 2. Server-Side Security

Even with Cloudflare, your server must be secure.

### Environment Secrets
- **CRITICAL**: Never commit your `.env` file.
- Use strong, unique passwords for `MONGODB_URI` and any session secrets.
- In production, set `NODE_ENV=production`.

### MongoDB Security
- **Authentication**: Ensure your MongoDB instance requires a username and password.
- **Network**: If possible, restrict MongoDB to only accept connections from `127.0.0.1` (localhost) so it's not exposed to the public internet.
- **Index Cleanup**: Ensure unique indexes are created as seen in your logs to prevent duplicate data/account hijacking.

### Application Logic (Node.js)
- **Rate Limiting**: Use a library like `express-rate-limit` to prevent brute-force attacks on your `/login` and `/register` endpoints.
- **Helmet**: Implement the `helmet` middleware to set various security-related HTTP headers automatically.
- **CORS**: Strictly define which domains can access your API.
- **Input Validation**: Never trust user input. Use libraries like `joi` or `zod` to validate all data before it hits the database.

---

## 3. Deployment Checklists

- [ ] Disable directory listing on your web server.
- [ ] Regularly run `npm audit` to check for vulnerable dependencies.
- [ ] Implement a Content Security Policy (CSP) header.
- [ ] Set up basic monitoring/alerts for downtime.

> [!IMPORTANT]
> Security is a continuous process. Review these settings at least once a quarter.
