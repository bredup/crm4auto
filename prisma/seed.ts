import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoservice.com' },
    update: {},
    create: {
      email: 'admin@autoservice.com',
      name: 'Администратор',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const services = [
    { name: 'Замена масла', price: 2500, duration: 60, category: 'ТО' },
    { name: 'Замена тормозных колодок', price: 4500, duration: 120, category: 'Тормоза' },
    { name: 'Компьютерная диагностика', price: 1500, duration: 30, category: 'Диагностика' },
    { name: 'Замена свечей зажигания', price: 3000, duration: 90, category: 'Двигатель' },
    { name: 'Балансировка колес', price: 2000, duration: 45, category: 'Шины' },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
