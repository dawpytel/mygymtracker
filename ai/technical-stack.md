# Technical Stack

This document outlines the complete technical stack used in the MyGymTracker project. Use this as a reference when proposing code solutions and architectural decisions.

## Frontend

### Core Framework & Language

- **React 19.1.1** - Latest React with concurrent features and server components
- **TypeScript 5.9.3** - Strict type safety and modern JavaScript features
- **Vite 7.1.7** - Next-generation frontend build tool with fast HMR

### Styling

- **Tailwind CSS 4.0.0** - Utility-first CSS framework
- **@tailwindcss/vite 4.0.0** - Vite plugin for Tailwind CSS integration
- Custom CSS modules support

### Development Tools

- **ESLint 9.36.0** - Code linting with TypeScript support
- **typescript-eslint 8.45.0** - TypeScript-specific linting rules
- **eslint-plugin-react-hooks 5.2.0** - React Hooks linting rules
- **eslint-plugin-react-refresh 0.4.22** - React Fast Refresh validation

### Build & Deployment

- **Nginx** - Production web server (configured via nginx.conf)
- **Docker** - Containerization for production deployment
- Node.js runtime environment

## Backend

### Core Framework & Language

- **NestJS 11.0.1** - Progressive Node.js framework for building efficient server-side applications
- **TypeScript 5.7.3** - Strict type safety and modern JavaScript features
- **Node.js** - JavaScript runtime environment

### Web Framework

- **Express** (via @nestjs/platform-express 11.0.1) - HTTP server framework
- **Helmet 8.1.0** - Security middleware for setting HTTP headers

### Database & ORM

- **PostgreSQL 15** (Alpine) - Primary relational database
- **TypeORM 0.3.27** - TypeScript-first ORM for database operations
- **@nestjs/typeorm 11.0.0** - NestJS integration for TypeORM
- **pg 8.16.3** - PostgreSQL client for Node.js

### Authentication & Authorization

- **Passport 0.7.0** - Authentication middleware
- **passport-jwt 4.0.1** - JWT authentication strategy
- **@nestjs/passport 11.0.5** - NestJS integration for Passport
- **@nestjs/jwt 11.0.1** - JWT utilities for NestJS

### Validation & Transformation

- **class-validator 0.14.2** - Decorator-based validation for DTOs
- **class-transformer 0.5.1** - Transform plain objects to class instances

### API Documentation

- **@nestjs/swagger 11.2.0** - OpenAPI/Swagger documentation generation

### Configuration Management

- **@nestjs/config 4.0.2** - Configuration module for NestJS

### Reactive Programming

- **RxJS 7.8.1** - Reactive extensions for JavaScript

### Testing

- **Jest 30.0.0** - JavaScript testing framework
- **ts-jest 29.2.5** - TypeScript preprocessor for Jest
- **@nestjs/testing 11.0.1** - Testing utilities for NestJS
- **Supertest 7.0.0** - HTTP assertion library for E2E testing

### Development Tools

- **ESLint 9.18.0** - Code linting
- **Prettier 3.4.2** - Code formatting
- **typescript-eslint 8.20.0** - TypeScript-specific linting rules
- **ts-node 10.9.2** - TypeScript execution environment
- **Nest CLI 11.0.0** - NestJS command-line interface

### Build & Deployment

- **Docker** - Containerization for production deployment
- Source maps support for debugging

## Infrastructure & DevOps

### Containerization

- **Docker** - Container platform
- **Docker Compose 3.8** - Multi-container orchestration

### Database Management

- **PostgreSQL 15 Alpine** - Production database
- **pgAdmin 4** - Database administration tool (development)

### Volume Management

- Persistent PostgreSQL data storage

### Testing Strategy

- **Unit testing** - Jest for component and service testing
- **E2E testing** - Supertest for API endpoint testing
- **Coverage reporting** - Jest coverage collection
- Test-driven development ready

### Version Control

- **Git** - Source control management
- Monorepo structure with frontend and backend

## Project Structure

### Monorepo Layout

```
/
├── frontend/          # React + Vite application
├── backend/           # NestJS API server
├── ai/                # AI-related documentation and prompts
├── docker-compose.yml # Development environment setup
└── README.md          # Project documentation
```
