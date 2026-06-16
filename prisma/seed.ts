import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Chapters
  const chapters = [
    { id: 1, title: "互联网+医疗健康发展政策", description: "41 questions" },
    { id: 2, title: "医务人员管理", description: "25 questions" },
    { id: 3, title: "互联网诊疗服务行为", description: "64 questions" },
    { id: 4, title: "信息安全", description: "18 questions" },
  ];

  for (const ch of chapters) {
    await prisma.chapter.upsert({
      where: { id: ch.id },
      update: ch,
      create: ch,
    });
  }
  console.log(`Created ${chapters.length} chapters`);

  // 2. Import questions from JSON
  const questionsPath = path.join(__dirname, "data", "questions.json");
  const raw = fs.readFileSync(questionsPath, "utf-8");
  const questionsData = JSON.parse(raw);

  for (const q of questionsData) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        chapterId: q.chapterId,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
      },
      create: {
        id: q.id,
        chapterId: q.chapterId,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
      },
    });
  }
  console.log(`Imported ${questionsData.length} questions`);

  // 3. Create default roles with ALL-mode configs
  const roleNames = ["医生", "护士", "技师", "管理人员"];
  for (const name of roleNames) {
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) continue;

    const role = await prisma.role.create({
      data: { name, description: "" },
    });

    // Default: ALL mode for all chapters
    for (const ch of chapters) {
      await prisma.roleConfig.create({
        data: {
          roleId: role.id,
          chapterId: ch.id,
          questionCount: 0, // 0 = ALL
        },
      });
    }
    console.log(`Created role: ${name}`);
  }

  // 4. Create default admin user
  const adminPhone = "admin";
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "管理员",
        phone: adminPhone,
        department: "管理部",
        isAdmin: true,
      },
    });
    console.log("Created admin user");
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
