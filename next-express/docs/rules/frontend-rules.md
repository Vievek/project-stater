# Frontend Rules

## Architecture: SOLID & Clean Code
The Next.js frontend strictly separates UI components from business logic and API communication.

## API Communication (Adapter Pattern)
- UI components MUST NOT call `fetch` or use third-party fetching libraries directly with raw URLs.
- All API calls must go through a dedicated API Service (e.g., `UserService`).
- The API Service is responsible for making the actual HTTP request and mapping the backend JSON response to a stable frontend TypeScript interface.
- If backend API endpoint names change, ONLY the API Service adapter should be updated.

## Styling
- Use Tailwind CSS.
- Use `shadcn/ui` for complex components.

## File Structure
- `src/components/ui/`: Contains generic, reusable UI components (e.g., Button, Input).
- `src/components/features/`: Contains domain-specific components.
- `src/services/api/`: Contains API adapters.
- `src/types/`: Contains frontend domain models and interfaces.
- `src/hooks/`: Custom React hooks.
