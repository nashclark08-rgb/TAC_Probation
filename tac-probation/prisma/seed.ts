import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const seedData = [
    {
      name: 'Sarah Thompson',
      email: 's.thompson@tac.qld.edu.au',
      subSchool: 'senior',
      department: 'Mathematics',
      startDate: new Date('2026-01-28'),
      currentStep: 3,
      completedSteps: [
        {
          stepNumber: 1,
          outcome: 'commendation',
          completedBy: 'Dr James Whitfield (HoD Mathematics)',
          notes:
            'Sarah engaged positively with the welcome process. Clear understanding of department expectations established. Strong preparation evident.',
          supportActions: 'Paired with experienced colleague for peer support.',
        },
        {
          stepNumber: 2,
          outcome: 'commendation',
          completedBy: 'Ms Rachel Nguyen (Dean of Studies)',
          notes:
            'Positive feedback received from all curriculum leaders. Sarah is demonstrating strong initial practice.',
          supportActions: 'None required at this stage.',
        },
      ],
    },
    {
      name: 'Michael Chen',
      email: 'm.chen@tac.qld.edu.au',
      subSchool: 'junior',
      department: 'Stage 2',
      startDate: new Date('2026-01-28'),
      currentStep: 1,
      completedSteps: [],
    },
    {
      name: 'Emma Cartwright',
      email: 'e.cartwright@tac.qld.edu.au',
      subSchool: 'senior',
      department: 'English',
      startDate: new Date('2026-01-28'),
      currentStep: 5,
      completedSteps: [
        {
          stepNumber: 1,
          outcome: 'commendation',
          completedBy: 'Ms Patricia Burns (HoD English)',
          notes: 'Emma demonstrated excellent knowledge of school systems and curriculum from day one.',
          supportActions: 'Regular check-ins with HoD scheduled for Term 1.',
        },
        {
          stepNumber: 2,
          outcome: 'commendation',
          completedBy: 'Mr David Park (Dean of Studies)',
          notes: 'All feedback from middle leaders was highly positive.',
          supportActions: null,
        },
        {
          stepNumber: 3,
          outcome: 'commendation',
          completedBy: 'Ms Patricia Burns (HoD English)',
          notes:
            'Outstanding lesson observation. Emma demonstrates deep content knowledge and exceptional student engagement strategies.',
          supportActions: 'Continue current trajectory.',
        },
        {
          stepNumber: 4,
          outcome: 'commendation',
          completedBy: 'Mr David Park (Dean of Studies)',
          notes:
            'Formal observation confirmed sustained high quality teaching. Classroom management exemplary. Assessment practices well-aligned.',
          supportActions: 'Discuss potential co-curricular contributions.',
        },
      ],
    },
  ]

  for (const data of seedData) {
    const { completedSteps, currentStep, ...staffData } = data

    const existing = await prisma.staff.findUnique({ where: { email: staffData.email } })
    if (existing) {
      console.log(`Skipping ${staffData.name} — already exists.`)
      continue
    }

    await prisma.staff.create({
      data: {
        ...staffData,
        probation: {
          create: {
            status: 'active',
            currentStep,
            steps: {
              create: Array.from({ length: 6 }, (_, i) => {
                const stepNum = i + 1
                const completedStep = completedSteps.find((s) => s.stepNumber === stepNum)
                return {
                  stepNumber: stepNum,
                  status: completedStep
                    ? 'completed'
                    : stepNum === currentStep
                    ? 'in_progress'
                    : 'pending',
                  outcome: completedStep?.outcome ?? null,
                  completedBy: completedStep?.completedBy ?? null,
                  notes: completedStep?.notes ?? null,
                  supportActions: completedStep?.supportActions ?? null,
                  completedAt: completedStep ? new Date() : null,
                }
              }),
            },
          },
        },
      },
    })
    console.log(`Created: ${staffData.name}`)
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
