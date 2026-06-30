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
