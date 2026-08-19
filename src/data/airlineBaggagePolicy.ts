// 편명(항공사 코드)으로 위탁/기내 수하물 허용 무게를 자동으로 채워주는 참고용 표.
// 실제 허용량은 좌석 등급·노선·구매한 추가 수하물에 따라 달라질 수 있으므로
// 조회 결과는 출발 항공사 고시 기준으로 다시 한번 확인하고, 다르면 직접 입력으로 덮어쓰는 걸 권장한다.

export interface AirlineBaggagePolicy {
  airlineName: string;
  checkedKg: number;
  carryOnKg: number;
}

const AIRLINE_BAGGAGE_POLICY: Record<string, AirlineBaggagePolicy> = {
  KE: { airlineName: '대한항공', checkedKg: 23, carryOnKg: 12 },
  OZ: { airlineName: '아시아나항공', checkedKg: 23, carryOnKg: 12 },
  '7C': { airlineName: '제주항공', checkedKg: 15, carryOnKg: 10 },
  LJ: { airlineName: '진에어', checkedKg: 15, carryOnKg: 12 },
  TW: { airlineName: '티웨이항공', checkedKg: 15, carryOnKg: 10 },
  BX: { airlineName: '에어부산', checkedKg: 15, carryOnKg: 10 },
  RS: { airlineName: '에어서울', checkedKg: 15, carryOnKg: 10 },
  ZE: { airlineName: '이스타항공', checkedKg: 15, carryOnKg: 10 },
  JL: { airlineName: '일본항공(JAL)', checkedKg: 23, carryOnKg: 10 },
  NH: { airlineName: 'ANA', checkedKg: 23, carryOnKg: 10 },
  CX: { airlineName: '캐세이퍼시픽', checkedKg: 23, carryOnKg: 7 },
  SQ: { airlineName: '싱가포르항공', checkedKg: 23, carryOnKg: 7 },
  TG: { airlineName: '타이항공', checkedKg: 23, carryOnKg: 7 },
  VN: { airlineName: '베트남항공', checkedKg: 23, carryOnKg: 12 },
  PR: { airlineName: '필리핀항공', checkedKg: 23, carryOnKg: 7 },
  UA: { airlineName: '유나이티드항공', checkedKg: 23, carryOnKg: 10 },
  DL: { airlineName: '델타항공', checkedKg: 23, carryOnKg: 10 },
  AA: { airlineName: '아메리칸항공', checkedKg: 23, carryOnKg: 10 },
  BA: { airlineName: '영국항공', checkedKg: 23, carryOnKg: 10 },
  AF: { airlineName: '에어프랑스', checkedKg: 23, carryOnKg: 12 },
  LH: { airlineName: '루프트한자', checkedKg: 23, carryOnKg: 8 },
};

/** "KE001", "ke 001", "7c123" 등 편명 문자열 앞의 항공사 코드(문자 1~2자리)를 뽑아 대문자로 정규화한다 */
function extractAirlineCode(flightNumber: string): string | null {
  const match = flightNumber.trim().toUpperCase().match(/^([0-9]?[A-Z]{1,2})\s*\d/);
  return match ? match[1] : null;
}

/** 편명을 넣으면 항공사 수하물 허용 무게(위탁/기내)를 찾아 돌려준다 — 모르는 항공사면 null */
export function lookupAirlineBaggage(flightNumber: string): AirlineBaggagePolicy | null {
  const code = extractAirlineCode(flightNumber);
  if (!code) return null;
  return AIRLINE_BAGGAGE_POLICY[code] ?? null;
}
