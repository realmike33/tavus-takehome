# Tavus Demo

This project is a conversational video demo that brings together real human guidance and service discovery. It connects people to community resources through an AI-powered interface that feels approachable, visual, and supportive. The goal was to make something that feels more like a friendly conversation than a database search.

## Background

After years of working with nonprofits and county agencies across the Bay Area, I saw how often people in need were met with confusing systems, long forms, or outdated tools. Those experiences shaped how I approached this demo. Instead of optimizing for speed or flash, I focused on clarity, empathy, and trust.

## Local Setup

Clone the repo, install dependencies, create .env.local file and add env variables shown in .env.example

```bash
yarn
yarn start
```

## How to Use

1. **Start a Conversation**
   - Click “Use Video” to connect with Tavus. A short loading state will appear while the system initializes your session.
   - Once connected, you’ll see a live conversational video feed appear on the right side of the screen.

2. **Ask or Search**
   - You can either **speak** to Tavus or type directly into the search box.
   - Tavus will interpret what you say and automatically highlight relevant services—like food banks, housing programs, or clinics.

3. **Explore Results**
   - Each service is displayed as a clean, readable card with its description, contact info, and location details.
   - When Tavus references multiple resources, it highlights all related results and scrolls you to the most relevant one.

4. **Filter & Focus**
   - Use the filter chips at the top to toggle between categories like Food, Housing, or Clinics.

5. **End the Session**
   - Click “Close Video” to end the conversation. You can always restart it later.

## High-Level Architecture

**Frontend (Next.js + TailwindCSS)**  

- Built with Next.js App Router and styled using TailwindCSS for responsive UI.  
- Client components handle live updates, filtering, and Tavus integration.

**Video & AI Layer (Tavus Conversational Video)**  

- Tavus provides a live video interface where the AI agent listens and responds.  
- Real-time communication happens through a Daily.co session object, which streams the video feed and relays Tavus’s structured messages.  
- Tavus sends “app-message” events that trigger UI updates (e.g. highlighting cards or filtering results).

**Resource Data Layer (Local JSON Dataset)**  

- Resource listings are loaded from a structured dataset (e.g., Alameda County resources).  
- Each record is normalized into a consistent format with categories like `Food Bank`, `Housing/Shelter`, and `Clinic`.  
- Client-side filtering and ranking logic determine which results match Tavus’s inferred intent.

**State Management (Zustand Store)**  

- Shared UI state (filters, query input, highlighted results) is managed through a lightweight global store.  
- Keeps the UI reactive while maintaining smooth transitions between Tavus updates and manual searches.

**Deployment (Vercel)**  

- Hosted on Vercel for fast static builds and edge delivery.  
- Automatically rebuilds and deploys on commit, ensuring consistent runtime behavior across environments.
