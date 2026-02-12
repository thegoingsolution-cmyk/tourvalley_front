# DB plan_type 화면 표시 통일 작업 요약

**작업일:** 2025-02-10 ~ 2025-02-11  
**목적:** `premium_rates` 테이블의 `plan_type`(DB 값)을 그대로 화면에 표시하고, API/계약에도 동일한 값을 사용하도록 통일.

---

## 0. 실손/비실손 보장내용 분리 (plan_coverages)

### 변경 경로
- `b2c/home/b2c/database/migration_add_plan_coverages.sql`
- `b2c/home/b2c/b2c_tourvalley_backend/src/routes/travel.ts`
- `b2c/home/b2c/b2c_tourvalley_front/src/app/domestic/pc/page.tsx`
- `b2c/home/b2c/b2c_tourvalley_front/src/app/domestic/m/page.tsx`
- `b2c/home/b2c/b2c_tourvalley_front/src/app/overseas/pc/page.tsx`
- `b2c/home/b2c/b2c_tourvalley_front/src/app/overseas/m/page.tsx`

### 내용
- **DB:** `plan_coverages`에 `medical_expense_type`(실손/비실손) 추가, 기본값 `실손`
- **API:** `/api/travel/plan-coverages`에 `has_medical_expense` 전달 → `medical_expense_type`로 필터링 (미전달 시 실손)
- **프론트:** 실손 옵션 변경 시 보장내용 재조회 + `has_medical_expense` 함께 전송

---

## 1. 국내 여행 보험 (domestic)

### 변경 경로
- `src/app/domestic/pc/page.tsx`
- `src/app/domestic/m/page.tsx`
- `src/components/travel/CoverageDetailModal.tsx`

### 내용
- **나이별 플랜 표시**
  - 15세 미만: `어린이플랜`만 표시 (기존 알림 후 중단 제거)
  - 15~70세: `실속플랜`, `표준플랜`
  - 71~90세: `어르신플랜1`, `어르신플랜2` 표시 (기존 알림 후 중단 제거)
- **보험료 재계산:** 고정 `['실속플랜','표준플랜']` 대신 **현재 `planInfo` 키** 기준으로 재계산
- **가입자별 보험료:** 나이에 따라 `어린이플랜` / `어르신플랜1`·`2` / 선택 플랜으로 `plan_type` 전송
- **CoverageDetailModal:** 어린이/어르신 플랜 선택 시 표준플랜 보장 내용 + **전달된 플랜명** 그대로 표시
- **보장내용 API 호출 경로 통일:** `plan-coverages`를 `/api/travel/plan-coverages`로 통일

---

## 2. 해외 여행 보험 (overseas)

### 변경 경로
- `src/app/overseas/pc/page.tsx`
- `src/app/overseas/m/page.tsx`

### 내용
- **가입자 보험료 계산:** 나이별 실제 plan_type 사용
  - 15세 미만 → `어린이플랜`
  - 71세 이상 → 선택한 `어르신플랜1` / `어르신플랜2`
  - 그 외 → STEP1 선택 플랜 (`표준플랜` 기본)
- 재계산은 이미 `Object.keys(planInfo)` 기준으로 동작
- **보장내용 API 호출 경로 통일:** `plan-coverages`를 `/api/travel/plan-coverages`로 통일

---

## 3. 해외 장기체류 (long-term-stay)

### 변경 경로
- `src/app/long-term-stay/pc/page.tsx`
- `src/app/long-term-stay/m/page.tsx`
- `src/components/travel/types.ts`
- `src/components/travel/PlanSelection.tsx`

### 내용
- **워킹홀리데이:** DB plan_type 그대로 표시·전송
  - `워킹홀리데이실속플랜`, `워킹홀리데이표준플랜`, `워킹홀리데이(유로화플랜)`
  - 기존 "실속/표준/고급" 표시명 제거, 위 3개 이름을 화면·API·계약에 사용
- **유학/어학연수 등:** 가입자별 나이에 따라 `어린이플랜` / `어르신플랜1`·`2` / 선택 플랜 사용
- **types.ts:** `PlanType`에 `워킹홀리데이실속플랜`, `워킹홀리데이표준플랜`, `워킹홀리데이(유로화플랜)` 추가
- **PlanSelection:** 위 워킹홀리데이 플랜 3종 표시 순서·이름·배지 색상 추가
- **재계산:** 워킹홀리데이 플랜별 원화/외화 구분하여 `currency_plan` 적용
- **보장내용 API 호출 경로 통일:** `plan-coverages`를 `/api/travel/plan-coverages`로 통일
- **플랜 목록 API 호출 경로 통일:** `available-plans`를 `/api/travel/available-plans`로 통일
- **보험료 계산 버튼 이벤트:** `onClick`에서 이벤트 객체 전달 방지 (`onClick={() => onCalculate()}`)로 초기 계산 실패 이슈 해결

---

## 4. 단체 여행자 보험 (group-insurance)

### 4-1. 단체 모바일 (`group-insurance/m/page.tsx`)

- **워킹홀리데이**
  - 화면·API: `워킹홀리데이실속플랜`, `워킹홀리데이표준플랜`, `워킹홀리데이(유로화플랜)` 사용
  - `WORKING_HOLIDAY_PLAN_MAPPING` 제거 → `WORKING_HOLIDAY_DB_PLANS` 상수로 대체
- **플랜 계산·재계산·그룹 재계산:** 워킹홀리데이 시 위 3개 DB 플랜으로 계산
- **가입자 보험료:** 워킹홀리데이 = 선택 플랜(DB명), 해외(FS) = 나이별 `어린이플랜`/`어르신플랜1`·`2`/선택 플랜
- **계약 등록:** `plan_type` = `selectedPlan` (DB 플랜명 그대로)
- **getLongTermStayCoverages:** 워킹홀리데이 DB 플랜명 → 실속/표준/고급 보장 내용 매핑

### 4-2. 단체 국내 (domestic)

- **step3** (`group-insurance/domestic/step3/page.tsx`): 옵션 라벨 `실속플랜(국내실손 포함)` → `실속플랜`, `표준플랜`
- **step5** (`group-insurance/domestic/step5/page.tsx`): `getPlanDisplayName` → `실속플랜`, `표준플랜` 반환

### 4-3. 단체 장기체류 (longstay)

- **step3** (`group-insurance/longstay/step3/page.tsx`): 워킹홀리데이 옵션 라벨  
  `실속플랜` → `워킹홀리데이실속플랜`, `표준플랜` → `워킹홀리데이표준플랜`, `고급플랜` → `워킹홀리데이(유로화플랜)`
- **step5** (`group-insurance/longstay/step5/page.tsx`):  
  - `getPlanType(planCode, travelPurpose)` 추가 (워킹홀리데이 시 DB 플랜명 반환)  
  - 표시·계약 시 `plan_type` = `getPlanType(planCode)` 사용
- **step2** (`group-insurance/longstay/step2/page.tsx`):  
  - `/api/travel/available-plans` 응답이 빈 배열이면 사전 안내 후 진행 중단
- **step3** (`group-insurance/longstay/step3/page.tsx`):  
  - 플랜 목록 수집 후 계산 트리거 보강 (plan_type 준비 완료 기준)  
  - 계획 유효성 체크를 plan_type 기준으로 보정  
  - 계산 과다 호출 방지: 디바운스 + 동일 요청 중복 차단 + inflight 보호

### 4-4. 단체 해외 (overseas)

- step3/step5의 `기준플랜`, `실속플랜`, `고보장플랜` 매핑은 **변경 없음** (단체 해외 전용 스키마로 추정)

---

## 5. 공통 유틸 (보험나이)

- **보험나이 계산 통일:** `utils/age.ts`의 `calculateInsuranceAge`에서 마지막 생일 기준 6개월 경과 로직으로 수정  
  - 그룹보험/개별보험 모두 동일 기준 적용

---

## 6. 체크리스트 (내일 검토용)

- [ ] 국내 PC: 15세 미만 / 71세 이상 입력 시 어린이플랜·어르신플랜1·2 노출 및 API 호출 확인
- [ ] 국내 M: 동일 시나리오 확인
- [ ] 해외 PC/M: 2인 이상 가입 시 가입자별 나이에 따른 plan_type 전송 확인
- [ ] 장기체류 PC/M: 워킹홀리데이 선택 시 3개 DB 플랜명 노출·결제·계약 확인
- [ ] 단체 M: 워킹홀리데이 탭에서 3개 DB 플랜 선택 후 보험료·계약 확인
- [ ] 단체 국내 step3/step5: 실속/표준만 표시되는지 확인
- [ ] 단체 장기 step3/step5: 워킹홀리데이 선택 시 DB 플랜명 표시·저장 확인
- [ ] CoverageDetailModal: 어린이플랜/어르신플랜1·2 선택 시 플랜명·보장 내용 표시 확인
- [ ] 장기체류 PC/M: 최초 보험료 계산 버튼 클릭 시 plan-coverages/available-plans/calculate-premium 호출 확인
- [ ] 단체 장기 step2: available-plans 빈 배열 시 사전 안내 확인

---

## 7. 참고: DB plan_type (premium_rates)

```sql
plan_type ENUM(
  '어린이플랜', '실속플랜', '표준플랜', '고급플랜',
  '어르신플랜1', '어르신플랜2', '어린이플랜2',
  '스키플랜(표준)', '스키플랜(어린이)',
  '워킹홀리데이실속플랜', '워킹홀리데이표준플랜'
)
```

워킹홀리데이 외화 플랜은 `워킹홀리데이(유로화플랜)` 로 API/프론트에서 사용 (foreign_currency_premium_rates 등 별도 테이블 가능성).

---

## 8. 보장 상세 DB 시드 추가 (coverage_detail_sections/items)

### 변경 경로
- `b2c/home/b2c/database/migration_add_coverage_detail_tables.sql`

### 내용
- 유학/어학연수·해외출장/주재원/교환교수: `B` + `외화플랜` 기준으로 실속/표준/고급/어린이/어린이2 시드 추가
- 워킹홀리데이: `B` 기준으로 실속/표준/유로화플랜 및 워킹홀리데이 전용 플랜 시드 추가