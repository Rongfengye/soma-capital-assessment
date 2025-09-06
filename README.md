## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Setup Instructions for Reviewers

⚠️ **Important**: This application requires a Pexels API key and database setup.

### 1. Get a Pexels API Key
1. Sign up for a free account at [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Generate your API key from the dashboard

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
PEXELS_API_KEY=your_pexels_api_key_here
```

### 3. Database Setup
Run the following commands to set up the database:
```bash
# Install dependencies
npm install

# Set up the database with all migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

### 4. First Run
- The app will start with an empty database
- Create a few tasks to see the dependency features in action
- Images will be automatically fetched from Pexels as you create tasks

**Note**: The database file (`prisma/dev.db`) is gitignored for security and to ensure each reviewer starts with a clean slate.

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!

## Solution

### 🎥 Demo Video
![Demo Video](./somademo.mov)

I've transformed the basic todo app into a comprehensive project management tool with advanced dependency tracking and visual enhancements. Here's what I built for each part:

### Part 1: Due Dates ✅

I made due dates a core requirement for every task since effective project management demands clear deadlines. When creating a task, users must select a due date using the integrated date picker I added to the form.

For overdue visualization, I went beyond just red text - I implemented a multi-layered approach:
- Overdue dates show in **bright red with bold text**
- Added a prominent "⚠️ OVERDUE" warning label
- Gave overdue tasks a **red left border** and light red background so they're impossible to miss
- Stored dates in UTC but display them in the user's local timezone for accuracy

I also made the pragmatic choice to allow creating tasks with past dates - they'll just be immediately flagged as overdue, which is useful for tracking delayed work.

### Part 2: Image Generation 🖼️

I integrated the Pexels API to automatically fetch relevant images for each task, making the interface much more visual and engaging. 

For the implementation, I chose a **server-side approach** to keep the API key secure. When a user creates a task, my backend:
1. Takes the task title as a search query
2. Calls the Pexels API to find relevant images
3. Stores the image URL in the database
4. Returns the complete task with image to the frontend

I added proper loading states ("Adding..." button) and graceful fallbacks - if no image is found, it shows a clean "no image found" placeholder instead of breaking the UI.

The images are sized at 100x100px to keep the interface clean while still being visually helpful for quickly identifying tasks.

### Part 3: Task Dependencies 🔗

This was the most complex part - I built a full dependency management system with critical path analysis. Here's how I tackled it:

#### Smart Dependency Selection
I created a **SearchAndAdd interface** where users type to search existing tasks. As they type "setup", they'll see suggestions like "Setup Database (Due: Dec 10 • 1 day)" with full context. I made sure to exclude the current task and already-selected dependencies from the results.

#### Bulletproof Validation
I implemented **real-time validation** that prevents two critical issues:
1. **Circular dependencies**: Using depth-first search, I detect if adding a dependency would create a loop (A depends on B, B depends on A)
2. **Illogical date ordering**: Dependencies must be due *before* the current task - no task due Dec 10 can depend on a task due Dec 15

When validation fails, the "Add Todo" button becomes disabled and shows "Fix Dependencies to Continue" with clear error messages.

#### Critical Path Analysis
I implemented the **Critical Path Method (CPM)** with forward and backward pass algorithms to identify which tasks cannot be delayed without affecting the project completion date. Critical path tasks get orange "Critical" badges and special highlighting.

#### Expandable Card Design
The original tree view got cluttered with multiple dependencies, so I redesigned it with **expandable cards**:

**Compact view** shows:
- "3 dependencies ▶ Show details" (clickable)
- "✅ Ready to start" (no dependencies)

**Expanded view** reveals:
- Numbered list of all dependencies with status
- Flow visualization: "Setup DB → API Design → Deploy App"  
- Calculated earliest start date
- Status indicators (✅ On track or ⚠️ Overdue for each dependency)

This scales beautifully from 1 dependency to 20+ dependencies while keeping the interface clean.

#### Database Design
I used a junction table approach with `TodoDependency` records linking tasks, plus added a `duration` field (in days) to each task for realistic timeline calculations.

### Technical Implementation

On the **backend**, I built RESTful API endpoints using Next.js API routes with comprehensive error handling. I chose Prisma ORM for type-safe database operations with SQLite - this gave me excellent TypeScript integration and made the complex dependency relationships much easier to manage.

For **algorithms**, I implemented several computer science fundamentals:
- **Depth-First Search** for circular dependency detection
- **Critical Path Method** with forward/backward pass for project scheduling
- **Topological sorting** for dependency ordering in visualizations

On the **frontend**, I used React with TypeScript throughout for type safety. The UI uses Tailwind CSS with a custom orange-to-red gradient theme that matches Soma's branding. I focused heavily on **real-time validation** - users get immediate feedback as they interact with forms, rather than waiting until submission.

The **expandable card pattern** I designed uses progressive disclosure - show just what users need to see, but make detailed information available on demand.

**Database Schema:**
```prisma
model Todo {
  id          Int      @id @default(autoincrement())
  title       String
  dueDate     DateTime
  duration    Int      @default(1)  // Added for timeline calculations
  imageUrl    String?               // Added for Pexels integration
  dependencies TodoDependency[] @relation("DependentTodo")
  dependents   TodoDependency[] @relation("DependencyTodo")
}

model TodoDependency {
  id           Int  @id @default(autoincrement())
  dependentId  Int  // Task that depends on another
  dependencyId Int  // Task that must be completed first
  @@unique([dependentId, dependencyId]) // Prevent duplicate relationships
}
```
