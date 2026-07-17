# Testing Rules

## Tooling
- Backend: Jest and Supertest.
- Frontend: Vitest and React Testing Library (if configured later).

## Unit Test Mocks (Backend)
- When testing the Controller layer, completely mock the Service layer.
- When testing the Service layer, completely mock the Repository layer.
- Use `jest.mock()` and `jest.spyOn()` for mocking dependencies.

## Naming Convention
- Test files must be named `[name].test.ts` or `[name].spec.ts` and reside alongside the file they are testing.

## Advanced Testing Strategies (DRY & SOLID)
- **Data Factories**: MUST use plain factory functions (e.g., `buildTodo()`, `buildTodoList()`) to generate test data instead of manually crafting objects in every test. Factories live in a `tests/factories/` directory alongside their module. Use sequential/static values — no external faker or factory libraries needed.
- **Parameterized Tests**: MUST use `test.each` (or `it.each`) to group similar test scenarios together. This reduces code duplication and improves coverage.
- **Decision Tables**: Use Markdown or comment-based decision tables to outline complex business rules, and then map those directly to parameterized test cases.
- **Property Testing**: For complex edge cases, MUST use property testing tools like `fast-check` to automatically generate broad inputs and uncover hidden bugs.

## Example Service Test
```typescript
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

jest.mock('./user.repository');

describe('UserService', () => {
  it('should return a user if found', async () => {
    // Arrange
    const mockUser = { id: 1, name: 'John Doe' };
    (UserRepository.prototype.findById as jest.Mock).mockResolvedValue(mockUser);
    const service = new UserService(new UserRepository());

    // Act
    const result = await service.getUser(1);

    // Assert
    expect(result).toEqual(mockUser);
  });
});
```
