-- ============================================================
-- HanVerse Database Schema v1.0
-- PostgreSQL (Supabase)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    wechat_openid VARCHAR(128) UNIQUE,
    display_name VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255),
    hsk_level INT DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 6),
    credits_remaining INT DEFAULT 1,  -- Free: 1 credit/day
    streak_days INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_active_date DATE,
    total_xp INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_date);

-- ============================================================
-- 2. Question Bank
-- ============================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
    category VARCHAR(64) DEFAULT 'daily',
    syllable_count INT NOT NULL,
    tone_distribution JSONB,  -- {"1st":3, "2nd":2, "3rd":4, "4th":1, "neutral":0}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_hsk ON questions(hsk_level);
CREATE INDEX idx_questions_category ON questions(category);

-- ============================================================
-- 3. Assessments
-- ============================================================
CREATE TYPE assessment_status AS ENUM ('pending', 'processing', 'done', 'failed');

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    reference_text TEXT NOT NULL,
    reference_pinyin TEXT NOT NULL,
    audio_url VARCHAR(1024),
    status assessment_status DEFAULT 'pending',
    -- Scoring results
    pronunciation_score DECIMAL(5,2),
    tone_score DECIMAL(5,2),
    fluency_score DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    hsk_estimate VARCHAR(8),
    cefr_estimate VARCHAR(4),
    -- Error details
    error_phonemes JSONB,
    explanation TEXT,
    report_data JSONB,
    -- Metadata
    processing_duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created ON assessments(created_at DESC);

-- ============================================================
-- 4. Practices
-- ============================================================
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    tasks JSONB NOT NULL,       -- Array of {type, instruction, options, answer}
    scores JSONB,               -- Array of {task_index, score, user_answer}
    completed BOOLEAN DEFAULT FALSE,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practices_user ON practices(user_id);
CREATE INDEX idx_practices_assessment ON practices(assessment_id);

-- ============================================================
-- 5. Orders (Payments)
-- ============================================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255) UNIQUE,
    amount_cents INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    package VARCHAR(32) NOT NULL,  -- "single", "5pack", "10pack", "30pack", "100pack"
    credits_purchased INT NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_stripe ON orders(stripe_session_id);

-- ============================================================
-- 6. Share Cards
-- ============================================================
CREATE TABLE share_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    image_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_share_cards_user ON share_cards(user_id);

-- ============================================================
-- 7. Audit Log (for compliance)
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- Seed Data: HSK1 Questions (30 sentences)
-- ============================================================
INSERT INTO questions (text, pinyin, hsk_level, category, syllable_count, tone_distribution) VALUES
('你好', 'nǐ hǎo', 1, 'greeting', 2, '{"3rd":1, "3rd":1}'),
('谢谢', 'xiè xiè', 1, 'greeting', 2, '{"4th":1, "4th":1}'),
('对不起', 'duì bù qǐ', 1, 'greeting', 3, '{"4th":1, "4th":1, "3rd":1}'),
('没关系', 'méi guān xì', 1, 'greeting', 3, '{"2nd":1, "1st":1, "4th":1}'),
('再见', 'zài jiàn', 1, 'greeting', 2, '{"4th":1, "4th":1}'),
('我叫小明', 'wǒ jiào xiǎo míng', 1, 'self_intro', 4, '{"3rd":1, "4th":1, "3rd":1, "2nd":1}'),
('我是学生', 'wǒ shì xué shēng', 1, 'self_intro', 4, '{"3rd":1, "4th":1, "2nd":1, "1st":1}'),
('我喜欢中文', 'wǒ xǐ huān zhōng wén', 1, 'hobby', 5, '{"3rd":1, "3rd":1, "1st":1, "1st":1, "2nd":1}'),
('今天星期一', 'jīn tiān xīng qī yī', 1, 'time', 5, '{"1st":2, "1st":1, "1st":1, "1st":1}'),
('明天见', 'míng tiān jiàn', 1, 'greeting', 3, '{"2nd":1, "1st":1, "4th":1}'),
('这个多少钱', 'zhè gè duō shǎo qián', 1, 'shopping', 5, '{"4th":1, "4th":1, "1st":1, "3rd":1, "2nd":1}'),
('太贵了', 'tài guì le', 1, 'shopping', 3, '{"4th":1, "4th":1, "neutral":1}'),
('我喝水', 'wǒ hē shuǐ', 1, 'daily', 3, '{"3rd":1, "1st":1, "3rd":1}'),
('吃饭了吗', 'chī fàn le ma', 1, 'daily', 4, '{"1st":1, "4th":1, "neutral":1, "neutral":1}'),
('我住北京', 'wǒ zhù běi jīng', 1, 'location', 4, '{"3rd":1, "4th":1, "3rd":1, "1st":1}'),
('我家有三口人', 'wǒ jiā yǒu sān kǒu rén', 1, 'family', 6, '{"3rd":1, "1st":1, "3rd":1, "1st":1, "3rd":1, "2nd":1}'),
('爸爸很高', 'bà bà hěn gāo', 1, 'family', 4, '{"4th":2, "3rd":1, "1st":1}'),
('妈妈很漂亮', 'mā mā hěn piào liàng', 1, 'family', 5, '{"1st":2, "3rd":1, "4th":1, "4th":1}'),
('今天很冷', 'jīn tiān hěn lěng', 1, 'weather', 4, '{"1st":1, "1st":1, "3rd":1, "3rd":1}'),
('明天会下雨', 'míng tiān huì xià yǔ', 1, 'weather', 5, '{"2nd":1, "1st":1, "4th":1, "4th":1, "3rd":1}'),
('我喜欢看书', 'wǒ xǐ huān kàn shū', 1, 'hobby', 5, '{"3rd":1, "3rd":1, "1st":1, "4th":1, "1st":1}'),
('我不会说中文', 'wǒ bú huì shuō zhōng wén', 1, 'language', 6, '{"3rd":1, "2nd":1, "4th":1, "1st":1, "1st":1, "2nd":1}'),
('请再说一遍', 'qǐng zài shuō yí biàn', 1, 'daily', 5, '{"3rd":1, "4th":1, "1st":1, "2nd":1, "4th":1}'),
('我不明白', 'wǒ bù míng bái', 1, 'daily', 4, '{"3rd":1, "4th":1, "2nd":1, "2nd":1}'),
('洗手间在哪里', 'xǐ shǒu jiān zài nǎ lǐ', 1, 'daily', 6, '{"3rd":1, "3rd":1, "1st":1, "4th":1, "3rd":1, "3rd":1}'),
('多少钱一张票', 'duō shǎo qián yì zhāng piào', 1, 'shopping', 6, '{"1st":1, "3rd":1, "2nd":1, "4th":1, "1st":1, "4th":1}'),
('今天几号', 'jīn tiān jǐ hào', 1, 'time', 4, '{"1st":1, "1st":1, "3rd":1, "4th":1}'),
('现在几点', 'xiàn zài jǐ diǎn', 1, 'time', 4, '{"4th":1, "4th":1, "3rd":1, "3rd":1}'),
('很高兴认识你', 'hěn gāo xìng rèn shí nǐ', 1, 'greeting', 6, '{"3rd":1, "1st":1, "4th":1, "4th":1, "2nd":1, "3rd":1}'),
('欢迎来中国', 'huān yíng lái zhōng guó', 1, 'greeting', 5, '{"1st":1, "2nd":1, "2nd":1, "1st":1, "2nd":1}');
-- ============================================================
-- Seed Data: HSK2 Questions (30 sentences)
-- Categories: daily, shopping, weather, transportation
-- ============================================================
INSERT INTO questions (text, pinyin, hsk_level, category, syllable_count, tone_distribution) VALUES
('你叫什么名字？', 'nǐ jiào shén me míng zì', 2, 'daily', 6, '{"2nd":2, "3rd":1, "4th":2, "neutral":1}'),
('我今年二十岁。', 'wǒ jīn nián èr shí suì', 2, 'self_intro', 6, '{"1st":1, "2nd":2, "3rd":1, "4th":2}'),
('你会说英语吗？', 'nǐ huì shuō yīng yǔ ma', 2, 'language', 6, '{"1st":2, "3rd":2, "4th":1, "neutral":1}'),
('这件衣服多少钱？', 'zhè jiàn yī fú duō shǎo qián', 2, 'shopping', 7, '{"1st":2, "2nd":2, "3rd":1, "4th":2}'),
('太贵了，便宜一点。', 'tài guì le pián yi yì diǎn', 2, 'shopping', 7, '{"2nd":1, "3rd":1, "4th":3, "neutral":2}'),
('明天天气怎么样？', 'míng tiān tiān qì zěn me yàng', 2, 'weather', 7, '{"1st":2, "2nd":1, "3rd":1, "4th":2, "neutral":1}'),
('今天比昨天冷。', 'jīn tiān bǐ zuó tiān lěng', 2, 'weather', 6, '{"1st":3, "2nd":1, "3rd":2}'),
('外面正在下雨。', 'wài miàn zhèng zài xià yǔ', 2, 'weather', 6, '{"3rd":1, "4th":5}'),
('我坐公共汽车去上班。', 'wǒ zuò gōng gòng qì chē qù shàng bān', 2, 'transportation', 9, '{"1st":3, "3rd":1, "4th":5}'),
('请问，地铁站在哪里？', 'qǐng wèn dì tiě zhàn zài nǎ lǐ', 2, 'transportation', 8, '{"3rd":4, "4th":4}'),
('往前一直走就到了。', 'wǎng qián yì zhí zǒu jiù dào le', 2, 'transportation', 8, '{"2nd":2, "3rd":2, "4th":3, "neutral":1}'),
('超市在学校的旁边。', 'chāo shì zài xué xiào de páng biān', 2, 'location', 8, '{"1st":2, "2nd":2, "4th":3, "neutral":1}'),
('我想买一斤苹果。', 'wǒ xiǎng mǎi yì jīn píng guǒ', 2, 'shopping', 7, '{"1st":1, "2nd":1, "3rd":4, "4th":1}'),
('他比我高一点。', 'tā bǐ wǒ gāo yì diǎn', 2, 'daily', 6, '{"1st":2, "3rd":3, "4th":1}'),
('你喜欢什么颜色？', 'nǐ xǐ huān shén me yán sè', 2, 'daily', 7, '{"1st":1, "2nd":2, "3rd":2, "4th":1, "neutral":1}'),
('我可以试试吗？', 'wǒ kě yǐ shì shì ma', 2, 'shopping', 6, '{"3rd":3, "4th":2, "neutral":1}'),
('这双鞋很舒服。', 'zhè shuāng xié hěn shū fú', 2, 'shopping', 6, '{"1st":2, "2nd":2, "3rd":1, "4th":1}'),
('你的中文很好。', 'nǐ de zhōng wén hěn hǎo', 2, 'language', 6, '{"1st":1, "2nd":1, "3rd":3, "neutral":1}'),
('我们一起去吧。', 'wǒ men yì qǐ qù ba', 2, 'daily', 6, '{"3rd":2, "4th":2, "neutral":2}'),
('从这儿到那儿远吗？', 'cóng zhèr dào nàr yuǎn ma', 2, 'transportation', 6, '{"2nd":1, "3rd":1, "4th":3, "neutral":1}'),
('今天下午有课吗？', 'jīn tiān xià wǔ yǒu kè ma', 2, 'education', 7, '{"1st":2, "3rd":2, "4th":2, "neutral":1}'),
('你准备好了吗？', 'nǐ zhǔn bèi hǎo le ma', 2, 'daily', 6, '{"3rd":3, "4th":1, "neutral":2}'),
('我想去看电影。', 'wǒ xiǎng qù kàn diàn yǐng', 2, 'hobby', 6, '{"3rd":3, "4th":3}'),
('他正在看电视。', 'tā zhèng zài kàn diàn shì', 2, 'daily', 6, '{"1st":1, "4th":5}'),
('你已经吃了吗？', 'nǐ yǐ jīng chī le ma', 2, 'daily', 6, '{"1st":2, "3rd":2, "neutral":2}'),
('这里可以刷卡吗？', 'zhè lǐ kě yǐ shuā kǎ ma', 2, 'shopping', 7, '{"1st":1, "3rd":4, "4th":1, "neutral":1}'),
('今天的天气真好。', 'jīn tiān de tiān qì zhēn hǎo', 2, 'weather', 7, '{"1st":4, "3rd":1, "4th":1, "neutral":1}'),
('我要去火车站。', 'wǒ yào qù huǒ chē zhàn', 2, 'transportation', 6, '{"1st":1, "3rd":2, "4th":3}'),
('能不能便宜一点？', 'néng bù néng pián yi yì diǎn', 2, 'shopping', 7, '{"2nd":3, "3rd":1, "4th":2, "neutral":1}'),
('我们坐出租车吧。', 'wǒ men zuò chū zū chē ba', 2, 'transportation', 7, '{"1st":3, "3rd":1, "4th":1, "neutral":2}');

-- ============================================================
-- Seed Data: HSK3 Questions (30 sentences)
-- Categories: travel, hobby, health, education
-- ============================================================
INSERT INTO questions (text, pinyin, hsk_level, category, syllable_count, tone_distribution) VALUES
('我打算去北京旅游。', 'wǒ dǎ suàn qù běi jīng lǚ yóu', 3, 'travel', 8, '{"1st":1, "2nd":1, "3rd":4, "4th":2}'),
('飞机几点起飞？', 'fēi jī jǐ diǎn qǐ fēi', 3, 'travel', 6, '{"1st":3, "3rd":3}'),
('请给我一张地图。', 'qǐng gěi wǒ yì zhāng dì tú', 3, 'travel', 7, '{"1st":1, "2nd":1, "3rd":3, "4th":2}'),
('这个城市的风景很美。', 'zhè gè chéng shì de fēng jǐng hěn měi', 3, 'travel', 9, '{"1st":1, "2nd":1, "3rd":3, "4th":3, "neutral":1}'),
('我在学打篮球。', 'wǒ zài xué dǎ lán qiú', 3, 'hobby', 6, '{"2nd":3, "3rd":2, "4th":1}'),
('他钢琴弹得很好。', 'tā gāng qín tán dé hěn hǎo', 3, 'hobby', 7, '{"1st":2, "2nd":3, "3rd":2}'),
('我每天都跑步。', 'wǒ měi tiān dōu pǎo bù', 3, 'hobby', 6, '{"1st":2, "3rd":3, "4th":1}'),
('你喜欢爬山吗？', 'nǐ xǐ huān pá shān ma', 3, 'hobby', 6, '{"1st":2, "2nd":1, "3rd":2, "neutral":1}'),
('周末我常常去游泳。', 'zhōu mò wǒ cháng cháng qù yóu yǒng', 3, 'hobby', 8, '{"1st":1, "2nd":3, "3rd":2, "4th":2}'),
('我头疼，想休息一下。', 'wǒ tóu téng xiǎng xiū xī yí xià', 3, 'health', 8, '{"1st":2, "2nd":3, "3rd":2, "4th":1}'),
('你应该去看医生。', 'nǐ yīng gāi qù kàn yī shēng', 3, 'health', 7, '{"1st":4, "3rd":1, "4th":2}'),
('药一天吃三次。', 'yào yì tiān chī sān cì', 3, 'health', 6, '{"1st":3, "4th":3}'),
('多喝热水对身体好。', 'duō hē rè shuǐ duì shēn tǐ hǎo', 3, 'health', 8, '{"1st":3, "3rd":3, "4th":2}'),
('我觉得不舒服。', 'wǒ jué dé bù shū fú', 3, 'health', 6, '{"1st":1, "2nd":3, "3rd":1, "4th":1}'),
('别忘了吃药。', 'bié wàng le chī yào', 3, 'health', 5, '{"1st":1, "2nd":1, "4th":2, "neutral":1}'),
('这学期我选了三门课。', 'zhè xué qī wǒ xuǎn le sān mén kè', 3, 'education', 9, '{"1st":2, "2nd":2, "3rd":2, "4th":2, "neutral":1}'),
('老师讲得很清楚。', 'lǎo shī jiǎng dé hěn qīng chǔ', 3, 'education', 7, '{"1st":2, "2nd":1, "3rd":4}'),
('我的作业还没做完。', 'wǒ de zuò yè hái méi zuò wán', 3, 'education', 8, '{"2nd":3, "3rd":1, "4th":3, "neutral":1}'),
('考试难不难？', 'kǎo shì nán bù nán', 3, 'education', 5, '{"2nd":2, "3rd":1, "4th":2}'),
('我每天晚上复习。', 'wǒ měi tiān wǎn shàng fù xí', 3, 'education', 7, '{"1st":1, "2nd":1, "3rd":3, "4th":2}'),
('这个周末有什么计划？', 'zhè gè zhōu mò yǒu shén me jì huà', 3, 'travel', 9, '{"1st":1, "2nd":1, "3rd":1, "4th":5, "neutral":1}'),
('我想学习书法。', 'wǒ xiǎng xué xí shū fǎ', 3, 'hobby', 6, '{"1st":1, "2nd":2, "3rd":3}'),
('附近有没有健身房？', 'fù jìn yǒu méi yǒu jiàn shēn fáng', 3, 'health', 8, '{"1st":1, "2nd":2, "3rd":2, "4th":3}'),
('我对花粉过敏。', 'wǒ duì huā fěn guò mǐn', 3, 'health', 6, '{"1st":1, "3rd":3, "4th":2}'),
('他的成绩提高了。', 'tā de chéng jì tí gāo le', 3, 'education', 7, '{"1st":2, "2nd":2, "4th":1, "neutral":2}'),
('我们下个月去旅行。', 'wǒ men xià gè yuè qù lǚ xíng', 3, 'travel', 8, '{"2nd":1, "3rd":2, "4th":4, "neutral":1}'),
('你会下围棋吗？', 'nǐ huì xià wéi qí ma', 3, 'hobby', 6, '{"2nd":2, "3rd":1, "4th":2, "neutral":1}'),
('感冒了要多休息。', 'gǎn mào le yào duō xiū xī', 3, 'health', 7, '{"1st":3, "3rd":1, "4th":2, "neutral":1}'),
('她学习非常努力。', 'tā xué xí fēi cháng nǔ lì', 3, 'education', 7, '{"1st":2, "2nd":3, "3rd":1, "4th":1}'),
('我要报名参加比赛。', 'wǒ yào bào míng cān jiā bǐ sài', 3, 'hobby', 8, '{"1st":2, "2nd":1, "3rd":2, "4th":3}');

-- ============================================================
-- Seed Data: HSK4 Questions (30 sentences)
-- Categories: work, society, technology, culture
-- ============================================================
INSERT INTO questions (text, pinyin, hsk_level, category, syllable_count, tone_distribution) VALUES
('我的工作经验很丰富。', 'wǒ de gōng zuò jīng yàn hěn fēng fù', 4, 'work', 9, '{"1st":3, "3rd":2, "4th":3, "neutral":1}'),
('我们需要提高效率。', 'wǒ men xū yào tí gāo xiào lǜ', 4, 'work', 8, '{"1st":2, "2nd":1, "3rd":1, "4th":3, "neutral":1}'),
('请把这个文件打印出来。', 'qǐng bǎ zhè gè wén jiàn dǎ yìn chū lái', 4, 'work', 10, '{"1st":1, "2nd":2, "3rd":3, "4th":4}'),
('会议推迟到下午三点。', 'huì yì tuī chí dào xià wǔ sān diǎn', 4, 'work', 9, '{"1st":2, "2nd":1, "3rd":2, "4th":4}'),
('她最近升职了。', 'tā zuì jìn shēng zhí le', 4, 'work', 6, '{"1st":2, "2nd":1, "4th":2, "neutral":1}'),
('社会上有很多变化。', 'shè huì shàng yǒu hěn duō biàn huà', 4, 'society', 8, '{"1st":1, "3rd":2, "4th":5}'),
('我们应该保护环境。', 'wǒ men yīng gāi bǎo hù huán jìng', 4, 'society', 8, '{"1st":2, "2nd":1, "3rd":2, "4th":2, "neutral":1}'),
('人们越来越重视健康。', 'rén men yuè lái yuè zhòng shì jiàn kāng', 4, 'society', 9, '{"1st":1, "2nd":2, "4th":5, "neutral":1}'),
('现在的年轻人很有想法。', 'xiàn zài de nián qīng rén hěn yǒu xiǎng fǎ', 4, 'society', 10, '{"1st":1, "2nd":2, "3rd":4, "4th":2, "neutral":1}'),
('大家应该互相帮助。', 'dà jiā yīng gāi hù xiāng bāng zhù', 4, 'society', 8, '{"1st":5, "4th":3}'),
('我的手机没电了。', 'wǒ de shǒu jī méi diàn le', 4, 'technology', 7, '{"1st":1, "2nd":1, "3rd":2, "4th":1, "neutral":2}'),
('请帮我连接无线网络。', 'qǐng bāng wǒ lián jiē wú xiàn wǎng luò', 4, 'technology', 9, '{"1st":2, "2nd":2, "3rd":3, "4th":2}'),
('这个软件很好用。', 'zhè gè ruǎn jiàn hěn hǎo yòng', 4, 'technology', 7, '{"3rd":3, "4th":4}'),
('人工智能发展得很快。', 'rén gōng zhì néng fā zhǎn dé hěn kuài', 4, 'technology', 9, '{"1st":2, "2nd":3, "3rd":2, "4th":2}'),
('请在网上下载这个文件。', 'qǐng zài wǎng shàng xià zǎi zhè gè wén jiàn', 4, 'technology', 10, '{"2nd":1, "3rd":3, "4th":6}'),
('中国有着悠久的历史。', 'zhōng guó yǒu zhe yōu jiǔ de lì shǐ', 4, 'culture', 9, '{"1st":2, "2nd":1, "3rd":3, "4th":1, "neutral":2}'),
('春节是中国最重要的节日。', 'chūn jié shì zhōng guó zuì zhòng yào de jié rì', 4, 'culture', 11, '{"1st":2, "2nd":3, "4th":5, "neutral":1}'),
('我喜欢听京剧。', 'wǒ xǐ huān tīng jīng jù', 4, 'culture', 6, '{"1st":3, "3rd":2, "4th":1}'),
('喝茶是中国人的传统。', 'hē chá shì zhōng guó rén de chuán tǒng', 4, 'culture', 9, '{"1st":2, "2nd":4, "3rd":1, "4th":1, "neutral":1}'),
('这个博物馆很有意思。', 'zhè gè bó wù guǎn hěn yǒu yì sī', 4, 'culture', 9, '{"1st":1, "2nd":1, "3rd":3, "4th":4}'),
('她正在准备面试。', 'tā zhèng zài zhǔn bèi miàn shì', 4, 'work', 7, '{"1st":1, "3rd":1, "4th":5}'),
('我们公司有三百个员工。', 'wǒ men gōng sī yǒu sān bǎi gè yuán gōng', 4, 'work', 10, '{"1st":4, "2nd":1, "3rd":3, "4th":1, "neutral":1}'),
('环境污染越来越严重。', 'huán jìng wū rǎn yuè lái yuè yán zhòng', 4, 'society', 9, '{"1st":1, "2nd":3, "3rd":1, "4th":4}'),
('互联网改变了我们的生活方式。', 'hù lián wǎng gǎi biàn le wǒ men de shēng huó fāng shì', 4, 'technology', 13, '{"1st":2, "2nd":2, "3rd":3, "4th":3, "neutral":3}'),
('传统节日应该被保护。', 'chuán tǒng jié rì yīng gāi bèi bǎo hù', 4, 'culture', 9, '{"1st":2, "2nd":2, "3rd":2, "4th":3}'),
('加班对身体不好。', 'jiā bān duì shēn tǐ bù hǎo', 4, 'work', 7, '{"1st":3, "3rd":2, "4th":2}'),
('科技进步改善了生活。', 'kē jì jìn bù gǎi shàn le shēng huó', 4, 'technology', 9, '{"1st":2, "2nd":1, "3rd":1, "4th":4, "neutral":1}'),
('每个国家的文化都不同。', 'měi gè guó jiā de wén huà dōu bù tóng', 4, 'culture', 10, '{"1st":2, "2nd":3, "3rd":1, "4th":3, "neutral":1}'),
('他在一家大公司工作。', 'tā zài yì jiā dà gōng sī gōng zuò', 4, 'work', 9, '{"1st":5, "4th":4}'),
('学习外语能开阔眼界。', 'xué xí wài yǔ néng kāi kuò yǎn jiè', 4, 'culture', 9, '{"1st":1, "2nd":3, "3rd":2, "4th":3}');
