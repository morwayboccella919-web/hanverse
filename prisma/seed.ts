import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const questions = [
  { text: "你好", pinyin: "nǐ hǎo", hskLevel: 1, category: "greeting", syllableCount: 2, toneDistribution: { "3rd": 2 } },
  { text: "谢谢", pinyin: "xiè xiè", hskLevel: 1, category: "greeting", syllableCount: 2, toneDistribution: { "4th": 2 } },
  { text: "对不起", pinyin: "duì bù qǐ", hskLevel: 1, category: "greeting", syllableCount: 3, toneDistribution: { "4th": 2, "3rd": 1 } },
  { text: "没关系", pinyin: "méi guān xì", hskLevel: 1, category: "greeting", syllableCount: 3, toneDistribution: { "2nd": 1, "1st": 1, "4th": 1 } },
  { text: "再见", pinyin: "zài jiàn", hskLevel: 1, category: "greeting", syllableCount: 2, toneDistribution: { "4th": 2 } },
  { text: "我叫小明", pinyin: "wǒ jiào xiǎo míng", hskLevel: 1, category: "self_intro", syllableCount: 4, toneDistribution: { "3rd": 2, "4th": 1, "2nd": 1 } },
  { text: "我是学生", pinyin: "wǒ shì xué shēng", hskLevel: 1, category: "self_intro", syllableCount: 4, toneDistribution: { "3rd": 1, "4th": 1, "2nd": 1, "1st": 1 } },
  { text: "我喜欢中文", pinyin: "wǒ xǐ huān zhōng wén", hskLevel: 1, category: "hobby", syllableCount: 5, toneDistribution: { "3rd": 2, "1st": 2, "2nd": 1 } },
  { text: "今天星期一", pinyin: "jīn tiān xīng qī yī", hskLevel: 1, category: "time", syllableCount: 5, toneDistribution: { "1st": 5 } },
  { text: "明天见", pinyin: "míng tiān jiàn", hskLevel: 1, category: "greeting", syllableCount: 3, toneDistribution: { "2nd": 1, "1st": 1, "4th": 1 } },
  { text: "这个多少钱", pinyin: "zhè gè duō shǎo qián", hskLevel: 1, category: "shopping", syllableCount: 5, toneDistribution: { "4th": 2, "1st": 1, "3rd": 1, "2nd": 1 } },
  { text: "太贵了", pinyin: "tài guì le", hskLevel: 1, category: "shopping", syllableCount: 3, toneDistribution: { "4th": 2, "neutral": 1 } },
  { text: "我喝水", pinyin: "wǒ hē shuǐ", hskLevel: 1, category: "daily", syllableCount: 3, toneDistribution: { "3rd": 2, "1st": 1 } },
  { text: "吃饭了吗", pinyin: "chī fàn le ma", hskLevel: 1, category: "daily", syllableCount: 4, toneDistribution: { "1st": 1, "4th": 1, "neutral": 2 } },
  { text: "我住北京", pinyin: "wǒ zhù běi jīng", hskLevel: 1, category: "location", syllableCount: 4, toneDistribution: { "3rd": 2, "4th": 1, "1st": 1 } },
  { text: "我家有三口人", pinyin: "wǒ jiā yǒu sān kǒu rén", hskLevel: 1, category: "family", syllableCount: 6, toneDistribution: { "3rd": 3, "1st": 2, "2nd": 1 } },
  { text: "爸爸很高", pinyin: "bà bà hěn gāo", hskLevel: 1, category: "family", syllableCount: 4, toneDistribution: { "4th": 2, "3rd": 1, "1st": 1 } },
  { text: "妈妈很漂亮", pinyin: "mā mā hěn piào liàng", hskLevel: 1, category: "family", syllableCount: 5, toneDistribution: { "1st": 2, "3rd": 1, "4th": 2 } },
  { text: "今天很冷", pinyin: "jīn tiān hěn lěng", hskLevel: 1, category: "weather", syllableCount: 4, toneDistribution: { "1st": 2, "3rd": 2 } },
  { text: "明天会下雨", pinyin: "míng tiān huì xià yǔ", hskLevel: 1, category: "weather", syllableCount: 5, toneDistribution: { "2nd": 1, "1st": 1, "4th": 2, "3rd": 1 } },
  { text: "我喜欢看书", pinyin: "wǒ xǐ huān kàn shū", hskLevel: 1, category: "hobby", syllableCount: 5, toneDistribution: { "3rd": 2, "1st": 2, "4th": 1 } },
  { text: "我不会说中文", pinyin: "wǒ bú huì shuō zhōng wén", hskLevel: 1, category: "language", syllableCount: 6, toneDistribution: { "3rd": 1, "2nd": 2, "4th": 1, "1st": 2 } },
  { text: "请再说一遍", pinyin: "qǐng zài shuō yí biàn", hskLevel: 1, category: "daily", syllableCount: 5, toneDistribution: { "3rd": 1, "4th": 2, "1st": 1, "2nd": 1 } },
  { text: "我不明白", pinyin: "wǒ bù míng bái", hskLevel: 1, category: "daily", syllableCount: 4, toneDistribution: { "3rd": 1, "4th": 1, "2nd": 2 } },
  { text: "洗手间在哪里", pinyin: "xǐ shǒu jiān zài nǎ lǐ", hskLevel: 1, category: "daily", syllableCount: 6, toneDistribution: { "3rd": 4, "1st": 1, "4th": 1 } },
  { text: "多少钱一张票", pinyin: "duō shǎo qián yì zhāng piào", hskLevel: 1, category: "shopping", syllableCount: 6, toneDistribution: { "1st": 2, "3rd": 1, "2nd": 1, "4th": 2 } },
  { text: "今天几号", pinyin: "jīn tiān jǐ hào", hskLevel: 1, category: "time", syllableCount: 4, toneDistribution: { "1st": 2, "3rd": 1, "4th": 1 } },
  { text: "现在几点", pinyin: "xiàn zài jǐ diǎn", hskLevel: 1, category: "time", syllableCount: 4, toneDistribution: { "4th": 2, "3rd": 2 } },
  { text: "很高兴认识你", pinyin: "hěn gāo xìng rèn shí nǐ", hskLevel: 1, category: "greeting", syllableCount: 6, toneDistribution: { "3rd": 2, "1st": 1, "4th": 2, "2nd": 1 } },
  { text: "欢迎来中国", pinyin: "huān yíng lái zhōng guó", hskLevel: 1, category: "greeting", syllableCount: 5, toneDistribution: { "1st": 2, "2nd": 3 } },
];

async function main() {
  console.log("Seeding questions...");
  await prisma.question.deleteMany();
  console.log("Cleared existing questions.");

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Seeded ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });