# Project: Local Content AI

## What this app does
An AI-powered content generator for local businesses (salons, gyms, 
restaurants, dentists). Business owners enter their info and get 30 days 
of social media posts, Google Business descriptions, and email newsletters.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL + Auth)
- AI: Anthropic Claude API
- Deployment: Vercel

## Project Structure
- /client → React frontend
- /client/src/components → React components
- /client/src/pages → Page components
- /server → Express backend

## Coding Conventions
- Use TypeScript everywhere
- Functional components only (no class components)
- camelCase for variables and functions
- PascalCase for components and types
- Always add JSDoc comments on functions
- Use async/await never .then() chains

## Environment Variables
- Never hardcode API keys
- All secrets go in .env files
- .env is always in .gitignore

## What NOT to do
- Never install new packages without telling me first
- Never use inline styles always use Tailwind classes
- Never expose API keys in frontend code

## Current Phase
Phase 1 - Project Setup and Scaffolding