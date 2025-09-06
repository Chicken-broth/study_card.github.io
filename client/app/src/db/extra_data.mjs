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
// type : question[] 
const questions = [
  {
    id: 1,
    category: rootWord,
    question_text: "語根と、意味/用例の組み合わせを選択してください",
    question_interaction: {
      type: "Association",
      data: [
        { id: 1, left: "-aud- / -audi-", right: "聞く" },
        { id: 2, left: "-auto-", right: "自己" },
        { id: 3, left: "-bene-", right: "良い、うまく" },
        { id: 4, left: "-bio-", right: "生命" },
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
        { id: 5, left: "-chron-", right: "時間" },
        { id: 6, left: "-dict-", right: "言う、話す" },
        { id: 7, left: "-duc- / -duct-", right: "導く" },
        { id: 8, left: "-gen-", right: "生む、生産する、種類" },
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
        { id: 9, left: "-geo-", right: "地球" },
        { id: 10, left: "-graph- / -gram-", right: "書く、描く、記録する" },
        { id: 11, left: "-hydr-", right: "水" },
        { id: 12, left: "-log- / -logy-", right: "言葉、研究" },
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
        { id: 13, left: "-man- / -manu-", right: "手" },
        { id: 14, left: "-meter- / -metr-", right: "測る" },
        { id: 15, left: "-ped- / -pod-", right: "足" },
        { id: 16, left: "-phon-", right: "音" },
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
        { id: 17, left: "-photo-", right: "光" },
        { id: 18, left: "-port-", right: "運ぶ" },
        { id: 19, left: "-rupt-", right: "壊す" },
        { id: 20, left: "-scrib- / -script-", right: "書く" },
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
        { id: 21, left: "-spec- / -spect-", right: "見る" },
        { id: 22, left: "-struct-", right: "建てる" },
        { id: 23, left: "-tele-", right: "遠い" },
        { id: 24, left: "-terr-", right: "地、土地" },
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
        { id: 25, left: "-therm-", right: "熱" },
        { id: 26, left: "-tract-", right: "引く" },
        { id: 27, left: "-ven- / -vent-", right: "来る" },
        { id: 28, left: "-vert- / -vers-", right: "回す" },
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
        { id: 29, left: "-vid- / -vis-", right: "見る" },
        { id: 30, left: "-voc- / -vok-", right: "声、呼ぶ" },
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
        { id: 31, left: "a-/an-", right: "〜でない、〜がない" },
        { id: 32, left: "anti-", right: "反対、逆" },
        { id: 33, left: "auto-", right: "自己、自動" },
        { id: 34, left: "bi-", right: "2つの" },
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
        { id: 35, left: "co-/con-/com-", right: "共に、一緒に" },
        { id: 36, left: "de-", right: "下へ、離れて、反対" },
        { id: 37, left: "dis-", right: "〜でない、〜の反対" },
        { id: 38, left: "ex-", right: "外へ、元の" },
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
        { id: 39, left: "fore-", right: "前に" },
        { id: 40, left: "il-/im-/in-/ir-", right: "〜でない" },
        { id: 41, left: "inter-", right: "間に、〜の間で" },
        { id: 42, left: "mal-", right: "悪い、不正な" },
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
        { id: 43, left: "micro-", right: "小さい" },
        { id: 44, left: "mid-", right: "中間の" },
        { id: 45, left: "mono-", right: "1つの" },
        { id: 46, left: "multi-", right: "多くの" },
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
        { id: 47, left: "non-", right: "〜でない" },
        { id: 48, left: "over-", right: "〜しすぎる、上に" },
        { id: 49, left: "post-", right: "後に" },
        { id: 50, left: "pre-", right: "前に" },
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
        { id: 51, left: "re-", right: "再び、後ろへ" },
        { id: 52, left: "sub-", right: "下に" },
        { id: 53, left: "super-", right: "上に、超えて" },
        { id: 54, left: "trans-", right: "横切って、通して" },
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
        { id: 55, left: "tri-", right: "3つの" },
        { id: 56, left: "un-", right: "〜でない、〜の反対" },
        { id: 57, left: "uni-", right: "1つの" },
        { id: 58, left: "under-", right: "〜が足りない、下に" },
      ],
    },
  },

];

export default {
  categories,
  questions,
}