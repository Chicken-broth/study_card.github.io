/**
 * 英語の接頭語・語根のクイズデータセット
 *
 * ### 接頭語
 *
 * | 接頭語 | 意味 | 単語例 |
 * |---|---|---|
 * | a-/an- | 〜でない、〜がない | atypical, anarchy, atheist |
 * | anti- | 反対、逆 | antisocial, antidote, anticlimax |
 * | auto- | 自己、自動 | automatic, autobiography, autonomous |
 * | bi- | 2つの | bicycle, bilingual, bimonthly |
 * | co-/con-/com- | 共に、一緒に | cooperate, connect, combine |
 * | de- | 下へ、離れて、反対 | decrease, detach, decode |
 * | dis- | 〜でない、〜の反対 | dishonest, disagree, disappear |
 * | ex- | 外へ、元の | exit, exclude, ex-president |
 * | fore- | 前に | forecast, foretell, foreword |
 * | il-/im-/in-/ir- | 〜でない | illegal, impossible, inactive, irregular |
 * | inter- | 間に、〜の間で | international, interact, interlude |
 * | mal- | 悪い、不正な | malfunction, malpractice, malnourished |
 * | micro- | 小さい | microscope, microcosm, microwave |
 * | mid- | 中間の | midway, midnight, midterm |
 * | mono- | 1つの | monologue, monotone, monopoly |
 * | multi- | 多くの | multicolor, multimedia, multiple |
 * | non- | 〜でない | nonstop, nonsense, non-profit |
 * | over- | 〜しすぎる、上に | overcook, overflow, overcome |
 * | post- | 後に | postpone, postgraduate, post-mortem |
 * | pre- | 前に | preview, preheat, prepare |
 * | re- | 再び、後ろへ | rewrite, return, rebuild |
 * | sub- | 下に | subway, submarine, submerge |
 * | super- | 上に、超えて | superhuman, supersonic, supervise |
 * | trans- | 横切って、通して | transport, transatlantic, translate |
 * | tri- | 3つの | tricycle, triangle, tripod |
 * | un- | 〜でない、〜の反対 | unhappy, undo, unfair |
 * | uni- | 1つの | unicycle, uniform, unique |
 * | under- | 〜が足りない、下に | undercooked, underestimate, undergo |
 *
 * ### 語根
 *
 * | 語根 | 意味 | 単語例 |
 * |---|---|---|
 * | -aud- / -audi- | 聞く | audience, audible, audition |
 * | -auto- | 自己 | automatic, autobiography, automobile |
 * | -bene- | 良い、うまく | benefit, benevolent, benign |
 * | -bio- | 生命 | biology, biography, biodegradable |
 * | -chron- | 時間 | chronological, synchronize, chronic |
 * | -dict- | 言う、話す | dictionary, predict, dictate |
 * | -duc- / -duct- | 導く | educate, conduct, introduce |
 * | -gen- | 生む、生産する、種類 | generate, genetic, genus |
 * | -geo- | 地球 | geography, geology, geometric |
 * | -graph- / -gram- | 書く、描く、記録する | photograph, telegram, graphic |
 * | -hydr- | 水 | hydrate, hydraulic, hydroplane |
 * | -log- / -logy- | 言葉、研究 | dialogue, biology, psychology |
 * | -man- / -manu- | 手 | manual, manufacture, manipulate |
 * | -meter- / -metr- | 測る | thermometer, metric, diameter |
 * | -ped- / -pod- | 足 | pedal, pedestrian, tripod |
 * | -phon- | 音 | telephone, phonics, symphony |
 * | -photo- | 光 | photograph, photosynthesis, photon |
 * | -port- | 運ぶ | transport, portable, import |
 * | -rupt- | 壊す | erupt, interrupt, bankrupt |
 * | -scrib- / -script- | 書く | scribble, describe, manuscript |
 * | -spec- / -spect- | 見る | inspect, spectator, perspective |
 * | -struct- | 建てる | construct, structure, destruction |
 * | -tele- | 遠い | telephone, television, telescope |
 * | -terr- | 地、土地 | terrain, territory, terrestrial |
 * | -therm- | 熱 | thermometer, thermal, thermostat |
 * | -tract- | 引く | attract, subtract, tractor |
 * | -ven- / -vent- | 来る | convention, intervene, prevent |
 * | -vert- / -vers- | 回す | convert, reverse, versatile |
 * | -vid- / -vis- | 見る | video, vision, visible |
 * | -voc- / -vok- | 声、呼ぶ | vocal, invoke, vocabulary |
 */
const rootWord = {
  id: 1, name: "語根", sub_id: 1, sub_name: "",
}
const prefix = {
  id: 2, name: "接頭語", sub_id: 1, sub_name: "",
}
//型定義はinterfaxes.tsのCategoryを厳守
const categories = [
  { id: 1, name: "語根", sub: [{ id: 1, name: "", }] },
  { id: 2, name: "接頭語", sub: [{ id: 1, name: "", }] },
];

/**
 * クイズの問題データセット
 *
 * ### 問題作成の注意事項
 * - `questions` 配列に新しい問題オブジェクトを追加することで、問題を作成できます。
 * - 各オブジェクトの `id` は、すべての問題でユニークである必要があります。
 * - `category` は、上で定義されている `rootWord` や `prefix` などを指定します。
 * - 型定義は `interfaces.ts` の `Question` に準拠する必要があります。
 *
 * ### 問題形式: "Association" (組み合わせ問題)
 * - `question_interaction.type` を `"Association"` に設定します。
 * - `question_interaction.data` は、`{ id, left, right }` のオブジェクト配列です。
 *   - `id`: 選択肢ペアのユニークID。すべてのAssociation問題のdata内でユニークである必要があります。
 *   - `left`: 語根or接頭語
 *   - `right`: 意味/単語
 *
 * ### 問題形式: "MultipleChoice" (四択問題)
 * - `question_interaction.type` を `"MultipleChoice"` に設定します。
 * - `question_interaction.data` は、`{ texts, correct_answer_index }` のオブジェクトです。
 *   - `texts`: 選択肢の文字列を配列で指定します。
 *   - `correct_answer_index`: 正解の選択肢のインデックスを **1-based** で指定します (例: 1, 2, 3, ...)。
 * 　　　各問題で正解以外の選択肢（ダミー選択肢）が、他の問題の答えからランダムに選ばれるように変更し、クイズの予測可能性を低減させます。
 */
const questions = [
  {
    id: 1,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 1, left: "-aud- / -audi-", right: "聞く	/ audience, audible, audition" },
        { id: 2, left: "-auto-", right: "自己	/ automatic, autobiography, automobile" },
        { id: 3, left: "-bene-", right: "良い、うまく	/ benefit, benevolent, benign" },
        { id: 4, left: "-bio-", right: "生命	/ biology, biography, biodegradable" },
      ],
    },
  },
  {
    id: 2,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 5, left: "-chron-", right: "時間	/ chronological, synchronize, chronic" },
        { id: 6, left: "-dict-", right: "言う、話す	/ dictionary, predict, dictate" },
        { id: 7, left: "-duc- / -duct-", right: "導く	/ educate, conduct, introduce" },
        { id: 8, left: "-gen-", right: "生む、生産する、種類	/ generate, genetic, genus" },
      ],
    },
  },
  {
    id: 3,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 9, left: "-geo-", right: "地球	/ geography, geology, geometric" },
        { id: 10, left: "-graph- / -gram-", right: "書く、描く、記録する	/ photograph, telegram, graphic" },
        { id: 11, left: "-hydr-", right: "水	/ hydrate, hydraulic, hydroplane" },
        { id: 12, left: "-log- / -logy-", right: "言葉、研究	/ dialogue, biology, psychology" },
      ],
    },
  },
  {
    id: 4,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 13, left: "-man- / -manu-", right: "手	/ manual, manufacture, manipulate" },
        { id: 14, left: "-meter- / -metr-", right: "測る	/ thermometer, metric, diameter" },
        { id: 15, left: "-ped- / -pod-", right: "足	/ pedal, pedestrian, tripod" },
        { id: 16, left: "-phon-", right: "音	/ telephone, phonics, symphony" },
      ],
    },
  },
  {
    id: 5,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 17, left: "-photo-", right: "光	/ photograph, photosynthesis, photon" },
        { id: 18, left: "-port-", right: "運ぶ	/ transport, portable, import" },
        { id: 19, left: "-rupt-", right: "壊す	/ erupt, interrupt, bankrupt" },
        { id: 20, left: "-scrib- / -script-", right: "書く	/ scribble, describe, manuscript" },
      ],
    },
  },
  {
    id: 6,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 21, left: "-spec- / -spect-", right: "見る	/ inspect, spectator, perspective" },
        { id: 22, left: "-struct-", right: "建てる	/ construct, structure, destruction" },
        { id: 23, left: "-tele-", right: "遠い	/ telephone, television, telescope" },
        { id: 24, left: "-terr-", right: "地、土地	/ terrain, territory, terrestrial" },
      ],
    },
  },
  {
    id: 7,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 25, left: "-therm-", right: "熱	/ thermometer, thermal, thermostat" },
        { id: 26, left: "-tract-", right: "引く	/ attract, subtract, tractor" },
        { id: 27, left: "-ven- / -vent-", right: "来る	/ convention, intervene, prevent" },
        { id: 28, left: "-vert- / -vers-", right: "回す	/ convert, reverse, versatile" },
      ],
    },
  },
  {
    id: 8,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 29, left: "-vid- / -vis-", right: "見る	/ video, vision, visible" },
        { id: 30, left: "-voc- / -vok-", right: "声、呼ぶ	/ vocal, invoke, vocabulary" },
      ],
    },
  },
  {
    id: 9,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 31, left: "a-/an-", right: "〜でない、〜がない / atypical, anarchy, atheist" },
        { id: 32, left: "anti-", right: "反対、逆 / antisocial, antidote, anticlimax" },
        { id: 33, left: "auto-", right: "自己、自動 / automatic, autobiography, autonomous" },
        { id: 34, left: "bi-", right: "2つの / bicycle, bilingual, bimonthly" },
      ],
    },
  },
  {
    id: 10,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 35, left: "co-/con-/com-", right: "共に、一緒に / cooperate, connect, combine" },
        { id: 36, left: "de-", right: "下へ、離れて、反対 / decrease, detach, decode" },
        { id: 37, left: "dis-", right: "〜でない、〜の反対 / dishonest, disagree, disappear" },
        { id: 38, left: "ex-", right: "外へ、元の / exit, exclude, ex-president" },
      ],
    },
  },
  {
    id: 11,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 39, left: "fore-", right: "前に / forecast, foretell, foreword" },
        { id: 40, left: "il-/im-/in-/ir-", right: "〜でない / illegal, impossible, inactive, irregular" },
        { id: 41, left: "inter-", right: "間に、〜の間で / international, interact, interlude" },
        { id: 42, left: "mal-", right: "悪い、不正な / malfunction, malpractice, malnourished" },
      ],
    },
  },
  {
    id: 12,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 43, left: "micro-", right: "小さい / microscope, microcosm, microwave" },
        { id: 44, left: "mid-", right: "中間の / midway, midnight, midterm" },
        { id: 45, left: "mono-", right: "1つの / monologue, monotone, monopoly" },
        { id: 46, left: "multi-", right: "多くの / multicolor, multimedia, multiple" },
      ],
    },
  },
  {
    id: 13,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 47, left: "non-", right: "〜でない / nonstop, nonsense, non-profit" },
        { id: 48, left: "over-", right: "〜しすぎる、上に / overcook, overflow, overcome" },
        { id: 49, left: "post-", right: "後に / postpone, postgraduate, post-mortem" },
        { id: 50, left: "pre-", right: "前に / preview, preheat, prepare" },
      ],
    },
  },
  {
    id: 14,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 51, left: "re-", right: "再び、後ろへ / rewrite, return, rebuild" },
        { id: 52, left: "sub-", right: "下に / subway, submarine, submerge" },
        { id: 53, left: "super-", right: "上に、超えて / superhuman, supersonic, supervise" },
        { id: 54, left: "trans-", right: "横切って、通して / transport, transatlantic, translate" },
      ],
    },
  },
  {
    id: 15,
    category: prefix,
    question_text: "接頭語と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 55, left: "tri-", right: "3つの / tricycle, triangle, tripod" },
        { id: 56, left: "un-", right: "〜でない、〜の反対 / unhappy, undo, unfair" },
        { id: 57, left: "uni-", right: "1つの / unicycle, uniform, unique" },
        { id: 58, left: "under-", right: "〜が足りない、下に / undercooked, underestimate, undergo" },
      ],
    },
  },
  ///語根 四択問題
  {
    id: 16,
    category: rootWord,
    question_text: "'-aud- / -audi-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["時間", "見る", "聞く", "運ぶ"],
        correct_answer_index: 3,
      },
    },
  },
  {
    id: 17,
    category: rootWord,
    question_text: "'-auto-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["手", "自己", "足", "生命"],
        correct_answer_index: 2,
      },
    },
  },
  {
    id: 18,
    category: rootWord,
    question_text: "'-bene-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["建てる", "引く", "良い、うまく", "壊す"],
        correct_answer_index: 3,
      },
    },
  },
  {
    id: 19,
    category: rootWord,
    question_text: "'-bio-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["導く", "生命", "地球", "言う、話す"],
        correct_answer_index: 2,
      },
    },
  },
  {
    id: 20,
    category: rootWord,
    question_text: "'-chron-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["光", "時間", "水", "音"],
        correct_answer_index: 2,
      },
    },
  },
  //接頭語　四択問題
  {
    id: 21,
    category: prefix,
    question_text: "'a-/an-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["〜でない、〜がない", "再び、後ろへ", "〜しすぎる、上に", "悪い、不正な"],
        correct_answer_index: 1,
      },
    },
  },
  {
    id: 22,
    category: prefix,
    question_text: "'anti-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["〜でない", "反対、逆", "中間の", "1つの"],
        correct_answer_index: 2,
      },
    },
  },
  {
    id: 23,
    category: prefix,
    question_text: "'auto-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["自己、自動", "2つの", "共に、一緒に", "下へ、離れて、反対"],
        correct_answer_index: 1,
      },
    },
  },
  {
    id: 24,
    category: prefix,
    question_text: "'bi-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["〜でない、〜の反対", "外へ、元の", "前に", "2つの"],
        correct_answer_index: 4,
      },
    },
  },
  {
    id: 25,
    category: prefix,
    question_text: "'co-/con-/com-' の意味/用例として最も適切なものはどれですか？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["共に、一緒に", "〜でない", "間に、〜の間で", "小さい"],
        correct_answer_index: 1,
      },
    },
  },


];
