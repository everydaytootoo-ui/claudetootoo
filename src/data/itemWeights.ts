/** 품목명 키워드로 대략적인 무게(g)를 추정하는 간이 사전 — 정밀 계량이 아닌 "감"을 잡는 용도 */
const WEIGHT_KEYWORDS_G: Array<[string, number]> = [
  ['보조배터리', 250],
  ['충전기', 150],
  ['카메라', 500],
  ['노트북', 1500],
  ['패딩', 700],
  ['코트', 900],
  ['자켓', 600],
  ['가디건', 300],
  ['수건', 300],
  ['우산', 400],
  ['운동화', 800],
  ['신발', 800],
  ['슬리퍼', 200],
  ['드라이기', 600],
  ['샴푸', 300],
  ['린스', 300],
  ['스킨', 200],
  ['로션', 200],
  ['선크림', 150],
  ['칫솔', 50],
  ['치약', 100],
  ['속옷', 50],
  ['양말', 30],
  ['티셔츠', 200],
  ['셔츠', 250],
  ['청바지', 600],
  ['바지', 400],
  ['원피스', 300],
  ['책', 400],
  ['우비', 200],
  ['선글라스', 80],
  ['핫팩', 20],
  ['여권', 40],
  ['지갑', 150],
];

const DEFAULT_ITEM_WEIGHT_G = 200;

export function estimateItemWeightGrams(name: string): number {
  const normalized = name.toLowerCase();
  for (const [keyword, grams] of WEIGHT_KEYWORDS_G) {
    if (normalized.includes(keyword.toLowerCase())) return grams;
  }
  return DEFAULT_ITEM_WEIGHT_G;
}
