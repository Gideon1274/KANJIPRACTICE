const kanjiData = {
    N5: [
        {
            kanji: "前に彼に会ったのを覚えている。",
            readings: ["まえ", "かれ", "あう", "おぼえる"],
            meanings: ["前に彼に会ったのを覚えている。", "まえに かれに あったのを おぼえている。", "I remember seeing him before."]
        },
        {
            kanji: "駅へ行く途中でにわか雨に遭った。",
            readings: ["えき", "いく", "とちゅう", "にわかあめ", "あう"],
            meanings: ["駅へ行く途中でにわか雨に遭った。", "えきへ いく とちゅうで にわかあめに あった。", "I was caught in a shower on my way to the station."]
        },
        {
            kanji: "日曜に会おう。",
            readings: ["にちよう", "あう"],
            meanings: ["日曜に会おう。", "にちように あおう。", "Let's meet on Sunday."]
        },
        {
            kanji: "よく彼に会う。",
            readings: ["よく", "かれ", "あう"],
            meanings: ["よく彼に会う。", "よく かれに あう。", "I often see him."]
        },
        {
            kanji: "彼女に再び会った。",
            readings: ["かのじょ", "ふたたび", "あう"],
            meanings: ["彼女に再び会った。", "かのじょに ふたたび あった。", "I saw her again."]
        },
        {
            kanji: "私は明日彼に会う。",
            readings: ["わたし", "あした", "かれ", "あう"],
            meanings: ["私は明日彼に会う。", "わたしは あした かれに あう。", "I'll be seeing him tomorrow.", "I'm going to see him tomorrow.", "I'm going to meet him tomorrow.", "I'll meet him tomorrow."]
        },
        {
            kanji: "昨日ケンに会った。",
            readings: ["きのう", "あう"],
            meanings: ["昨日ケンに会った。", "きのう けんに あった。", "I met Ken yesterday."]
        },
        {
            kanji: "確かに会いました。",
            readings: ["たしかに", "あう"],
            meanings: ["確かに会いました。", "たしかに あいました。", "I did see him."]
        },
        {
            kanji: "この間彼に会った。",
            readings: ["このあいだ", "かれ", "あう"],
            meanings: ["この間彼に会った。", "このあいだ かれに あった。", "I met him the other day."]
        },
        {
            kanji: "会えなくて寂しい。",
            readings: ["あう", "さびしい"],
            meanings: ["会えなくて寂しい。", "あえなくて さびしい。", "I miss you."]
        },
        {
            kanji: "彼は時々会いに来る。",
            readings: ["かれ", "ときどき", "あう", "くる"],
            meanings: ["彼は時々会いに来る。", "かれは ときどき あいに くる。", "He comes to see me once in a while."]
        },
        {
            kanji: "彼に会いたいものだ。",
            readings: ["かれ", "あう", "たい", "もの"],
            meanings: ["彼に会いたいものだ。", "かれに あいたいものだ。", "I would like to meet him."]
        },
        {
            kanji: "私は彼に駅で会った。",
            readings: ["わたし", "かれ", "えき", "あう"],
            meanings: ["私は彼に駅で会った。", "わたしは かれに えきで あった。", "I met him at the station."]
        },
        {
            kanji: "私は前日彼に会った。",
            readings: ["わたし", "ぜんじつ", "かれ", "あう"],
            meanings: ["私は前日彼に会った。", "わたしは ぜんじつ かれに あった。", "I met him the day before."]
        },
        {
            kanji: "先週彼に会いました。",
            readings: ["せんしゅう", "かれ", "あう"],
            meanings: ["先週彼に会いました。", "せんしゅう かれに あいました。", "I saw him last week."]
        },
        {
            kanji: "私は昨日彼に会った。",
            readings: ["わたし", "きのう", "かれ", "あう"],
            meanings: ["私は昨日彼に会った。", "わたしは きのう かれに あった。", "I met him yesterday."]
        },
        {
            kanji: "私は再び彼に会った。",
            readings: ["わたし", "ふたたび", "かれ", "あう"],
            meanings: ["私は再び彼に会った。", "わたしは ふたたび かれに あった。", "I saw him again."]
        },
        {
            kanji: "最近あまり会わない。",
            readings: ["さいきん", "あまり", "あう"],
            meanings: ["最近あまり会わない。", "さいきん あまり あわない。", "We don't meet very often recently."]
        },
        {
            kanji: "今夜彼らに会います。",
            readings: ["こんや", "かれら", "あう"],
            meanings: ["今夜彼らに会います。", "こんや かれらに あいます。", "I'm seeing them tonight."]
        },
        {
            kanji: "久しく彼に会わない。",
            readings: ["ひさしく", "かれ", "あう"],
            meanings: ["久しく彼に会わない。", "ひさしく かれに あわない。", "I haven't seen him for a long time."]
        },
        {
            kanji: "会えば必ず喧嘩する。",
            readings: ["あう", "かならず", "けんか"],
            meanings: ["会えば必ず喧嘩する。", "あえば かならず けんかする。", "Whenever they meet, they quarrel."]
        },
        {
            kanji: "また会えて嬉しいわ。",
            readings: ["また", "あう", "うれしい", "わ"],
            meanings: ["また会えて嬉しいわ。", "また あえて うれしいわ。", "Glad to see you again.", "I'm glad to see you again."]
        },
        {
            kanji: "また会えて嬉しいよ。",
            readings: ["また", "あう", "うれしい"],
            meanings: ["また会えて嬉しいよ。", "また あえて うれしいよ。", "Nice to see you again!"]
        },
        {
            kanji: "ふと街で彼に会った。",
            readings: ["ふと", "まち", "かれ", "あう"],
            meanings: ["ふと街で彼に会った。", "ふと まちで かれに あった。", "I met him on the street by chance."]
        },
        {
            kanji: "来年は会えるでしょう。",
            readings: ["らいねん", "あう", "でしょ"],
            meanings: ["来年は会えるでしょう。", "らいねんは あえるでしょ。", "I'll be able to see you next year.", "I will be able to see you next year."]
        },
        {
            kanji: "来月お会いしましょう。",
            readings: ["らいげつ", "あう"],
            meanings: ["来月お会いしましょう。", "らいげつ おあいしましょう。", "I'll see you next month."]
        },
        {
            kanji: "彼女は私に会いにきた。",
            readings: ["かのじょ", "わたし", "あう", "くる"],
            meanings: ["彼女は私に会いにきた。", "かのじょは わたしに あいにきた。", "She came to see me."]
        },
        {
            kanji: "彼は交通事故に遭った。",
            readings: ["かれ", "こうつうじこ", "あう"],
            meanings: ["彼は交通事故に遭った。", "かれは こうつうじこに あった。", "He met with a traffic accident.", "He was in a traffic accident.", "He had a traffic accident.", "He was involved in a traffic accident."]
        },
        {
            kanji: "先生に今週会えますか。",
            readings: ["せんせい", "こんしゅう", "あう"],
            meanings: ["先生に今週会えますか。", "せんせいに こんしゅう あえますか。", "Can the doctor see me this week?"]
        },
        {
            kanji: "是非、彼に会いたいわ。",
            readings: ["ぜひ", "かれ", "あう", "たい", "わ"],
            meanings: ["是非、彼に会いたいわ。", "ぜひ かれに あいたいわ。", "I want to see him at all costs."]
        },
        {
            kanji: "私達は、時々店で会う。",
            readings: ["わたしたち", "ときどき", "みせ", "あう"],
            meanings: ["私達は、時々店で会う。", "わたしたちは ときどき みせで あう。", "We meet sometimes at the shop."]
        },
        {
            kanji: "私は先週彼女に会った。",
            readings: ["わたし", "せんしゅう", "かのじょ", "あう"],
            meanings: ["私は先週彼女に会った。", "わたしは せんしゅう かのじょに あった。", "I saw her last week."]
        },
        {
            kanji: "私は初めて彼に会った。",
            readings: ["わたし", "はじめて", "かれ", "あう"],
            meanings: ["私は初めて彼に会った。", "わたしは はじめて かれに あった。", "I met him for the first time."]
        },
        {
            kanji: "私は古い友人に会った。",
            readings: ["わたし", "ふるい", "ゆうじん", "あう"],
            meanings: ["私は古い友人に会った。", "わたしは ふるい ゆうじんに あった。", "I saw an old friend of mine.", "I met an old friend of mine."]
        },
        {
            kanji: "私はけさボブに会った。",
            readings: ["わたし", "けさ", "あう"],
            meanings: ["私はけさボブに会った。", "わたしは けさ ぼぶに あった。", "I saw Bob this morning."]
        },
        {
            kanji: "今夜お会いできますか。",
            readings: ["こんや", "あう", "できます"],
            meanings: ["今夜お会いできますか。", "こんや おあいできますか。", "Can I see you tonight?"]
        },
        {
            kanji: "君にぜひ会いたいから。",
            readings: ["きみ", "ぜひ", "あう", "たい", "から"],
            meanings: ["君にぜひ会いたいから。", "きみに ぜひ あいたいから。", "I'm anxious to see you."]
        },
        {
            kanji: "会えて嬉しかったです。",
            readings: ["あう", "うれしい"],
            meanings: ["会えて嬉しかったです。", "あえて うれしかったです。", "It's been nice meeting you."]
        },
        {
            kanji: "逢うは別れの始め。",
            readings: ["あう", "わかれ", "はじめ"],
            meanings: ["逢うは別れの始め。", "あうは わかれの はじめ。", "We never meet without a parting."]
        },
        {
            kanji: "ほんの一度会っただけ。",
            readings: ["ほんの", "いちど", "あう", "だけ"],
            meanings: ["ほんの一度会っただけ。", "ほんの いちど あっただけ。", "I saw him but once."]
        },
        {
            kanji: "ともかく会いましょう。",
            readings: ["ともかく", "あう"],
            meanings: ["ともかく会いましょう。", "ともかく あいましょう。", "Anyhow I will see him."]
        },
        {
            kanji: "君に会えて嬉しいんだ。",
            readings: ["きみ", "あう", "うれしい"],
            meanings: ["君に会えて嬉しいんだ。", "きみに あえて うれしいんだ。", "I'm glad to see you.", "I'm pleased to meet you.", "I am happy to meet you.", "I'm happy to meet you."]
        },
        {
            kanji: "いつか彼に会っている。",
            readings: ["いつか", "かれ", "あう"],
            meanings: ["いつか彼に会っている。", "いつか かれに あっている。", "I met him once."]
        },
        {
            kanji: "あまり彼に会いません。",
            readings: ["あまり", "かれ", "あう"],
            meanings: ["あまり彼に会いません。", "あまり かれに あいません。", "I don't see much of him.", "I don't meet him so often."]
        },
        {
            kanji: "来週の今日お会いします。",
            readings: ["らいしゅう", "きょう", "あう"],
            meanings: ["来週の今日お会いします。", "らいしゅうの きょう おあいします。", "I'll see you a week from today."]
        },
        {
            kanji: "明日は友達と会う予定だ。",
            readings: ["あした", "ともだち", "あう", "よてい"],
            meanings: ["明日は友達と会う予定だ。", "あしたは ともだちと あう よていだ。", "I am seeing a friend tomorrow.", "I'm seeing a friend tomorrow."]
        },
        {
            kanji: "彼らは週に１回会う。",
            readings: ["かれら", "しゅう", "かい", "あう"],
            meanings: ["彼らは週に１回会う。", "かれらは しゅうに いっかい あう。", "They meet once a week."]
        },
        {
            kanji: "彼はよく私に会いに来た。",
            readings: ["かれ", "よく", "わたし", "あう", "くる"],
            meanings: ["彼はよく私に会いに来た。", "かれは よく わたしに あいに きた。", "He would often come to see me."]
        },
        {
            kanji: "彼に会う機会を見送った。",
            readings: ["かれ", "あう", "きかい", "みおくる"],
            meanings: ["彼に会う機会を見送った。", "かれに あう きかいを みおくった。", "I passed up an opportunity to see him."]
        },
        {
            kanji: "先週京都でメグに会った。",
            readings: ["せんしゅう", "きょうと", "あう"],
            meanings: ["先週京都でメグに会った。", "せんしゅう きょうとで めぐに あった。", "I met Meg in Kyoto last week."]
        },
        {
            kanji: "人込みの中で彼と会った。",
            readings: ["ひとごみ", "なか", "かれ", "あう"],
            meanings: ["人込みの中で彼と会った。", "ひとごみの なかで かれと あった。", "I met him in the crowd."]
        },
        {
            kanji: "私は彼女に会えて嬉しい。",
            readings: ["わたし", "かのじょ", "あう", "うれしい"],
            meanings: ["私は彼女に会えて嬉しい。", "わたしは かのじょに あえて うれしい。", "I am glad to see her."]
        },
        {
            kanji: "私は途中で彼女に会った。",
            readings: ["わたし", "とちゅう", "かのじょ", "あう"],
            meanings: ["私は途中で彼女に会った。", "わたしは とちゅうで かのじょに あった。", "I met her along the way."]
        },
        {
            kanji: "私は途中でトムに会った。",
            readings: ["わたし", "とちゅう", "あう"],
            meanings: ["私は途中でトムに会った。", "わたしは とちゅうで とむに あった。", "I met Tom on the way."]
        },
        {
            kanji: "私は通りで彼女と会った。",
            readings: ["わたし", "とおり", "かのじょ", "あう"],
            meanings: ["私は通りで彼女と会った。", "わたしは とおりで かのじょと あった。", "I met her on the street.", "I met her in the street."]
        },
        {
            kanji: "最近彼に会っていません。",
            readings: ["さいきん", "かれ", "あう"],
            meanings: ["最近彼に会っていません。", "さいきん かれに あっていません。", "I haven't seen him lately."]
        },
        {
            kanji: "私は空港で友達に会った。",
            readings: ["わたし", "くうこう", "ともだち", "あう"],
            meanings: ["私は空港で友達に会った。", "わたしは くうこうで ともだちに あった。", "I met a friend of mine at the airport."]
        },
        {
            kanji: "私は教会で彼女に会った。",
            readings: ["わたし", "きょうかい", "かのじょ", "あう"],
            meanings: ["私は教会で彼女に会った。", "わたしは きょうかいで かのじょに あった。", "I met her at the church."]
        },
        {
            kanji: "私は、偶然旧友に会った。",
            readings: ["わたし", "ぐうぜん", "きゅうゆう", "あう"],
            meanings: ["私は、偶然旧友に会った。", "わたしは ぐうぜん きゅうゆうに あった。", "I met an old friend by chance."]
        },
        {
            kanji: "再び彼に会う望みはない。",
            readings: ["ふたたび", "かれ", "あう", "のぞみ", "ない"],
            meanings: ["再び彼に会う望みはない。", "ふたたび かれに あう のぞみはない。", "There is little chance of my meeting him again."]
        },
        {
            kanji: "今晩私は彼女に会います。",
            readings: ["こんばん", "わたし", "かのじょ", "あう"],
            meanings: ["今晩私は彼女に会います。", "こんばん わたしは かのじょに あいます。", "I'm seeing her this evening.", "I'm meeting her this evening."]
        },
        {
            kanji: "今日の午後会いましょう。",
            readings: ["きょう", "ごご", "あう"],
            meanings: ["今日の午後会いましょう。", "きょうの ごご あいましょう。", "Let's meet this afternoon."]
        },
        {
            kanji: "偶然、彼女と会ったんだ。",
            readings: ["ぐうぜん", "かのじょ", "あう", "んだ"],
            meanings: ["偶然、彼女と会ったんだ。", "ぐうぜん かのじょと あったんだ。", "I met her by accident.", "I met her by chance."]
        },
        {
            kanji: "お会いできて嬉しいです。",
            readings: ["あう", "できて", "うれしい"],
            meanings: ["お会いできて嬉しいです。", "おあいできて うれしいです。", "I'm pleased to meet you.", "I am delighted to meet you.", "Nice to meet you.", "It's a pleasure to meet you."]
        },
        {
            kanji: "又来年会えるといいですね。",
            readings: ["また", "らいねん", "あう", "いい"],
            meanings: ["又来年会えるといいですね。", "また らいねん あえるといいですね。", "Hope to see you again next year."]
        },
        {
            kanji: "彼らは彼女の紹介で会った。",
            readings: ["かれら", "かのじょ", "しょうかい", "あう"],
            meanings: ["彼らは彼女の紹介で会った。", "かれらは かのじょの しょうかいで あった。", "They met through her introduction."]
        },
        {
            kanji: "彼と会ったのが幸いだった。",
            readings: ["かれ", "あう", "さいわい"],
            meanings: ["彼と会ったのが幸いだった。", "かれと あったのが さいわいだった。", "I was happy to see him."]
        },
        {
            kanji: "彼と会うのが楽しみだなあ。",
            readings: ["かれ", "あう", "たのしみ", "なー"],
            meanings: ["彼と会うのが楽しみだなあ。", "かれと あうのが たのしみだなー。", "I'm looking forward to seeing him."]
        },
        {
            kanji: "私は彼に会ったことがある。",
            readings: ["わたし", "かれ", "あう", "ことがある"],
            meanings: ["私は彼に会ったことがある。", "わたしは かれに あったことがある。", "I have met him before."]
        },
        {
            kanji: "私は社長に会いたいのです。",
            readings: ["わたし", "しゃちょう", "あう", "たい", "んです"],
            meanings: ["私は社長に会いたいのです。", "わたしは しゃちょうに あいたいのです。", "I want to see the director of the company."]
        },
        {
            kanji: "私は時折学校で彼女に会う。",
            readings: ["わたし", "ときおり", "がっこう", "かのじょ", "あう"],
            meanings: ["私は時折学校で彼女に会う。", "わたしは ときおり がっこうで かのじょに あう。", "I meet her at school now and then."]
        },
        {
            kanji: "私は偶然空港で彼に会った。",
            readings: ["わたし", "ぐうぜん", "くうこう", "かれ", "あう"],
            meanings: ["私は偶然空港で彼に会った。", "わたしは ぐうぜん くうこうで かれに あった。", "It chanced that I met him at the airport."]
        },
        {
            kanji: "昨年会ったのを覚えている。",
            readings: ["さくねん", "あう", "おぼえる"],
            meanings: ["昨年会ったのを覚えている。", "さくねん あったのを おぼえている。", "I remember seeing you last year."]
        },
        {
            kanji: "家に帰る途中で犬に会った。",
            readings: ["いえ", "かえる", "とちゅう", "いぬ", "あう"],
            meanings: ["家に帰る途中で犬に会った。", "いえに かえる とちゅうで いぬに あった。", "I met a dog on my way home."]
        },
        {
            kanji: "一体どこで彼に会ったんだ。",
            readings: ["いったい", "どこ", "かれ", "あう", "んだ"],
            meanings: ["一体どこで彼に会ったんだ。", "いったい どこで かれに あったんだ。", "Where on earth did you meet him?"]
        },
        {
            kanji: "たまには会いに来て下さい。",
            readings: ["たまに", "あう", "くる", "ください"],
            meanings: ["たまには会いに来て下さい。", "たまには あいに きてください。", "Come and see me once in a while."]
        },
        {
            kanji: "お会い出来てうれしいです。",
            readings: ["あう", "できる", "うれしい"],
            meanings: ["お会い出来てうれしいです。", "おあい できて うれしいです。", "It's nice to meet you."]
        },
        {
            kanji: "ある冬の朝私は彼に会った。",
            readings: ["ある", "ふゆ", "あさ", "わたし", "かれ", "あう"],
            meanings: ["ある冬の朝私は彼に会った。", "ある ふゆの あさ わたしは かれに あった。", "One winter morning I met him."]
        },
        {
            kanji: "ある学生に会うところです。",
            readings: ["ある", "がくせい", "あう", "ところ"],
            meanings: ["ある学生に会うところです。", "ある がくせいに あうところです。", "I'm going to see some student.", "I'm going to meet a certain student."]
        },
        {
            kanji: "あなたに再び会えて嬉しい。",
            readings: ["あなた", "ふたたび", "あう", "うれしい"],
            meanings: ["あなたに再び会えて嬉しい。", "あなたに ふたたび あえて うれしい。", "I'm glad to see you again."]
        },
        {
            kanji: "有名人と偶然会うのは珍しい。",
            readings: ["ゆうめいじん", "ぐうぜん", "あう", "めずらしい"],
            meanings: ["有名人と偶然会うのは珍しい。", "ゆうめいじんと ぐうぜん あうのは めずらしい。", "We rarely come across big names."]
        },
        {
            kanji: "昼間、友人が私に会いに来た。",
            readings: ["ひるま", "ゆうじん", "わたし", "あう", "くる"],
            meanings: ["昼間、友人が私に会いに来た。", "ひるま ゆうじんが わたしに あいに きた。", "A friend of mine came to see me during the day."]
        },
        {
            kanji: "歯医者さんに今日会えますか。",
            readings: ["はいしゃ", "さん", "きょう", "あう"],
            meanings: ["歯医者さんに今日会えますか。", "はいしゃさんに きょう あえますか。", "Can the dentist see me today?"]
        },
        {
            kanji: "私たちは所定の場所で会った。",
            readings: ["わたしたち", "しょてい", "ばしょ", "あう"],
            meanings: ["私たちは所定の場所で会った。", "わたしたちは しょていの ばしょで あった。", "We met at the designated spot."]
        },
        {
            kanji: "海水浴中に彼は友達に会った。",
            readings: ["かいすいよく", "ちゅう", "かれ", "ともだち", "あう"],
            meanings: ["海水浴中に彼は友達に会った。", "かいすいよくちゅうに かれは ともだちに あった。", "He met his friend while bathing in the sea."]
        },
        {
            kanji: "やあ、こんな所で会うとはね。",
            readings: ["やあ", "こんな", "ところ", "あう"],
            meanings: ["やあ、こんな所で会うとはね。", "やあ こんな ところで あうとはね。", "Hello. Fancy meeting you here.", "Hello, I never thought I'd meet you in a place like this.", "Hi, I didn't expect to see you here."]
        },
        {
            kanji: "ひょっとして彼女と会ったの？",
            readings: ["ひょっとして", "かのじょ", "あう"],
            meanings: ["ひょっとして彼女と会ったの？", "ひょっとして かのじょと あったの？", "Do you mean you met her!?"]
        },
        {
            kanji: "では、後で会いましょう。",
            readings: ["では", "あとで", "あう"],
            meanings: ["では、後で会いましょう。", "では あとで あいましょう。", "Well, see you later."]
        },
        {
            kanji: "ディックは交通事故に遭った。",
            readings: ["こうつうじこ", "あう"],
            meanings: ["ディックは交通事故に遭った。", "でぃっくは こうつうじこに あった。", "Dick had a traffic accident."]
        },
        {
            kanji: "そこに行くたびに彼女に会う。",
            readings: ["そこ", "いく", "たびに", "かのじょ", "あう"],
            meanings: ["そこに行くたびに彼女に会う。", "そこに いく たびに かのじょに あう。", "Every time I go there, I meet her."]
        },
        {
            kanji: "こんなところで君に会うとは！",
            readings: ["こんな", "ところ", "きみ", "あう", "とは"],
            meanings: ["こんなところで君に会うとは！", "こんな ところで きみに あうとは！", "Fancy meeting you here!"]
        },
        {
            kanji: "あの時以来彼に会っていない。",
            readings: ["あの", "とき", "いらい", "かれ", "あう"],
            meanings: ["あの時以来彼に会っていない。", "あの とき いらい かれに あっていない。", "I have not seen him since.", "I haven't seen him since then.", "I haven't seen him since."]
        }
    ],
    N4: [
        {
            kanji: "会う",
            readings: ["あう", "au"],
            meanings: ["to meet", "to encounter", "to see", "to have an accident", "to have a bad experience"]
        }
    ],
    N3: [
        {
            kanji: "会う",
            readings: ["あう", "au"],
            meanings: ["to meet", "to encounter", "to see", "to have an accident", "to have a bad experience"]
        }
    ],
    N2: [
        {
            kanji: "会う",
            readings: ["あう", "au"],
            meanings: ["to meet", "to encounter", "to see", "to have an accident", "to have a bad experience"]
        }
    ],
    N1: [
        {
            kanji: "会う",
            readings: ["あう", "au"],
            meanings: ["to meet", "to encounter", "to see", "to have an accident", "to have a bad experience"]
        }
    ]
};