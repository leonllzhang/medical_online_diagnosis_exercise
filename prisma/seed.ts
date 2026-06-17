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

  // 4. Create Departments
  const departmentNames = [
    "瘢痕与创面治疗科", "颅颌面整形科", "面颈整形科", "会阴整形与性别重塑科",
    "乳腺综合整形科", "外耳整形再造科", "血管瘤与脉管畸形整形科", "综合整形科",
    "脂肪整形科", "创伤修复与组织再生科", "皮肤科", "口腔医学美容中心",
    "激光美容中心", "注射美容中心", "毛发移植中心", "数字化技术中心",
    "肥胖与代谢病中心", "神经内科", "内科", "眼科", "耳鼻咽喉科", "营养科",
    "麻醉科", "放射科", "肾内科", "骨科", "基本外科", "急诊医学中心",
    "神经外科", "瘢痕微创治疗中心", "鼻整形再造科", "乳房整形科",
    "唇腭裂整形科", "儿科", "医务处",
  ];
  for (const name of departmentNames) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Created ${departmentNames.length} departments`);

  // 5. Create default admin user
  const adminPhone = "admin";
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "管理员",
        phone: adminPhone,
        department: "医务处",
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
