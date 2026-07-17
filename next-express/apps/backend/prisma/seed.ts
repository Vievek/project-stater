import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  // Clear existing data (optional, but good for fresh seed)
  await prisma.todo.deleteMany({});
  
  const user = await prisma.user.create({
    data: {
      name: 'Seed User',
      email: 'seed@example.com',
      password: 'password123',
    },
  });

  // Create sample todos
  const todo1 = await prisma.todo.create({
    data: {
      title: 'Learn Dependency Injection',
      completed: true,
      userId: user.id,
    },
  });

  const todo2 = await prisma.todo.create({
    data: {
      title: 'Implement Integration Tests Factory',
      completed: true,
      userId: user.id,
    },
  });

  const todo3 = await prisma.todo.create({
    data: {
      title: 'Setup Redis Graceful Degradation',
      completed: true,
      userId: user.id,
    },
  });
  
  const todo4 = await prisma.todo.create({
    data: {
      title: 'Master OCP and SOLID principles',
      completed: false,
      userId: user.id,
    },
  });

  console.log(`Created 4 Todos. Example ID: ${todo1.id}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
