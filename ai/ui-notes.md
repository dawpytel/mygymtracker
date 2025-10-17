<!-- 2e5c5c6f-92a7-452d-975e-29f012a43800 a24f2d96-4bff-4821-9af5-7873bac85d29 -->

# UI Architecture Questions and Recommendations

1. How should we structure the authentication views (email/password registration, login, OAuth Google/Apple) and their routes to enable seamless protected routing?

Recommendation: Use dedicated `/register` and `/login` pages with a shared `AuthForm` component, integrate OAuth buttons, and implement a guard redirecting unauthenticated users to `/login`.

2. What is the optimal view hierarchy for Plan Mode given the `GET /plans`, `POST /plans`, `PUT /plans/:id`, and `DELETE /plans/:id` endpoints?

Recommendation: Use nested routes under `/plans`—a list view at `/plans`, a create form at `/plans/new`, and an edit/detail form at `/plans/:id`—to leverage React Router’s nested UI patterns.

3. How should we design the flow and routing for Workout Mode—from selecting a plan (`POST /sessions`) through logging sets (`POST /sessions/:sessionId/exercises/:id/sets`) to saving or cancelling sessions (`PATCH`/`DELETE`) actions?

Recommendation: Implement a wizard-style flow: `/sessions/new` for plan selection, `/sessions/:id` for logging (with tabs or accordion per exercise), and confirmation modals for save/cancel actions.

4. What UI component patterns suit displaying AI-generated technique descriptions and recent history (`GET /sessions/:id`) alongside input fields for reps/load?

Recommendation: Use accordion components for collapsible technique and history sections, lazy-load AI text via suspense, and group input fields in a responsive grid with clear headings.

5. How should client-side form validation mirror server-side `class-validator` rules (e.g., max lengths, numeric ranges) for both plan creation and session logging?

Recommendation: Employ React Hook Form with `yup` or `zod` schemas matching DTO constraints, displaying inline error messages and disabling submit until validation passes.

6. What state management strategy should we use for fetching plans, exercises, sessions, and sets to ensure UI responsiveness?

Recommendation: Utilize React Query for data fetching and state management, deferring explicit caching configuration until a later phase and focusing initially on query simplicity and UI synchronization.

7. How should loading and error states for all API calls be surfaced in the UI to maintain a smooth user experience?

Recommendation: Show skeleton loaders for lists, spinner overlays for form submissions, toast notifications for errors/success, and provide retry buttons on failed fetches.

8. How will the interface adapt responsively across mobile, tablet, and desktop for key screens like plan lists, plan editor, workout logging, and history detail?

Recommendation: Adopt a mobile-first design with Tailwind’s responsive utilities, break tables into stacked cards on narrow viewports, and test at common breakpoints (sm/md/lg).

9. What accessibility standards (ARIA roles, keyboard navigation, color contrast) need to be enforced across forms, accordions, modals, and dynamic content sections?

Recommendation: Use semantic HTML, ensure all interactive elements have focus states and `aria-` attributes, label form fields explicitly, and validate contrast ratios against WCAG AA.

10. How should JWT tokens and session state be stored and managed in the UI to align with the backend’s Passport-JWT and OAuth flows?

Recommendation: Store tokens in HTTP-only secure cookies, refresh via silent endpoint calls, guard protected routes at the component level, and clear cookies on logout.
