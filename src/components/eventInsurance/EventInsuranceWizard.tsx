'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { checkAndSaveTrackingInfo } from '@/utils/tracking';
import './wizard.css';
import type {
  ErrorMap,
  OptCovKey,
  PlanKey,
  RiskKey,
  VenueType,
  LocationType,
  WizardProps,
  WizardState,
} from './types';
import {
  AMT,
  BASECOV,
  CATEGORIES,
  EVENT_FORM_TYPES,
  OPTROWS,
  PLANS,
  PLAY_FACILITY_TYPES,
  RISK_DEFS,
  STEP_LABELS,
  TIMES,
  createInitialState,
} from './constants';
import {
  applyPlanDefaults,
  buildFormData,
  buildPlaceText,
  curLimits,
  formatBizNoInput,
  formatMobileInput,
  formatTelInput,
  optCovSummaryLabel,
  planDisplayName,
  recommendPlan,
  validateStep,
} from './utils';

const ALLOWED_DOC_EXTS = ['hwp', 'hwpx', 'pdf', 'jpg', 'jpeg', 'gif', 'png', 'doc', 'docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function Tip({ text }: { text: string }) {
  return (
    <span className="ei-tip" tabIndex={0} data-tip={text}>
      ?
    </span>
  );
}

function validateAndPickFile(file: File | undefined | null): File | null {
  if (!file) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_DOC_EXTS.includes(ext)) {
    alert('업로드할 수 없는 확장자입니다.');
    return null;
  }
  if (file.size > MAX_FILE_SIZE) {
    alert('용량이 10mb 이하인 파일만 업로드할 수 있습니다.\n10mb를 초과하는 파일은 이메일로 보내주세요.');
    return null;
  }
  return file;
}

export default function EventInsuranceWizard({ device }: WizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(() => createInitialState());
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAndSaveTrackingInfo();
  }, []);

  const rec = useMemo(() => recommendPlan(data), [data.people, data.riskFlags]);

  // 사용자가 플랜을 직접 선택하기 전까지는 추천값을 자동 적용
  useEffect(() => {
    if (!data.planTouched) {
      setData((prev) => (prev.plan === rec ? prev : applyPlanDefaults(prev, rec)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec]);

  const update = (patch: Partial<WizardState>) => setData((prev) => ({ ...prev, ...patch }));

  const setRisk = (key: RiskKey, val: boolean) => {
    setData((prev) => ({
      ...prev,
      riskFlags: { ...prev.riskFlags, [key]: val },
    }));
  };

  const setPlan = (key: PlanKey) => {
    setData((prev) => {
      const withTouch: WizardState = { ...prev, plan: key, planTouched: true };
      if (key === '1형' || key === '2형') {
        return applyPlanDefaults(withTouch, key);
      }
      return withTouch;
    });
  };

  const toggleOpt = (key: OptCovKey) => {
    update({ optCov: { ...data.optCov, [key]: !data.optCov[key] } });
  };

  const setOptLimit = (key: OptCovKey, col: string, val: string) => {
    update({ optLimits: { ...data.optLimits, [key]: { ...data.optLimits[key], [col]: val } } });
  };

  const setLimit = (field: keyof WizardState['limits'], val: string) => {
    update({ limits: { ...data.limits, [field]: val } });
  };

  const togglePlType = (value: string) => {
    const cur = data.riskDetail.pl.types;
    const nextTypes = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ riskDetail: { ...data.riskDetail, pl: { ...data.riskDetail.pl, types: nextTypes } } });
  };

  const setWaterDetail = (field: keyof WizardState['riskDetail']['ws'], val: string) => {
    update({ riskDetail: { ...data.riskDetail, ws: { ...data.riskDetail.ws, [field]: val } } });
  };
  const setPlayDetail = (field: keyof WizardState['riskDetail']['pl'], val: string) => {
    update({ riskDetail: { ...data.riskDetail, pl: { ...data.riskDetail.pl, [field]: val } } });
  };
  const setMoveDetail = (field: keyof WizardState['riskDetail']['mv'], val: string) => {
    update({ riskDetail: { ...data.riskDetail, mv: { ...data.riskDetail.mv, [field]: val } } });
  };

  const handleSingleFile = (type: 'license' | 'overview', file: File | undefined | null) => {
    const picked = validateAndPickFile(file);
    if (!picked) return;
    if (type === 'license') update({ licenseFile: picked });
    else update({ overviewFile: picked });
  };

  const handleAmusementPhotos = (files: FileList | null) => {
    if (!files || !files.length) return;
    update({ amusementPhotos: Array.from(files) });
  };

  const goNext = () => {
    const { ok, errors: errs } = validateStep(step, data);
    setErrors(errs);
    if (!ok) return;
    setStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitQuote = async () => {
    const { ok, errors: errs } = validateStep(5, data);
    setErrors(errs);
    if (!ok) return;

    setSubmitting(true);
    try {
      const fd = buildFormData(data, device);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/event-insurance/estimate`,
        {
          method: 'POST',
          body: fd,
          credentials: 'include',
        }
      );
      const result = await response.json();
      if (result.success) {
        update({ contractNumber: result.data?.contract_number || '' });
        setStep(6);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(result.message || '견적 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적 신청 오류:', error);
      alert('견적 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setData(createInitialState());
    setErrors({});
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limits = curLimits(data);
  const isDirect = data.plan === '직접';

  return (
    <div className="ei-wizard">
      <div className="ei-wrap">
        <div className="ei-hero">
          <h1>행사보험 견적신청</h1>
          <p>축제·공연·전시·체육행사 등 모든 행사의 배상책임 위험, 간편하게 견적받으세요.</p>
        </div>

        <div className="ei-prog">
          {STEP_LABELS.map((label, idx) => {
            const s = idx + 1;
            const cls = ['ei-st', s === step ? 'on' : '', s < step ? 'done' : ''].filter(Boolean).join(' ');
            return (
              <div className={cls} key={label}>
                <div className="ei-line" />
                <div className="ei-dot">{s}</div>
                <div className="ei-lab">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="ei-card">
          {step === 1 && (
            <>
              <h2>어떤 형태의 행사인가요?</h2>
              <p className="ei-desc">행사 진행 방식을 선택해 주세요.</p>
              <div className="ei-opts">
                {EVENT_FORM_TYPES.map(({ key, desc }) => (
                  <div
                    key={key}
                    className={`ei-opt ${data.type === key ? 'sel' : ''}`}
                    onClick={() => update({ type: key as WizardState['type'] })}
                  >
                    <div className="ei-t">{key}</div>
                    <div className="ei-d">{desc}</div>
                  </div>
                ))}
              </div>
              {errors.type && <div className="ei-err-msg show">행사유형을 선택해 주세요.</div>}
              <div className="ei-nav">
                <button className="ei-btn pri" onClick={goNext}>
                  다음단계
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>행사 내용을 알려주세요</h2>
              <p className="ei-desc">정확한 견적을 위해 행사 정보를 입력해 주세요.</p>

              <div className="ei-field">
                <label>
                  행사 종류<span className="ei-req">*</span>
                </label>
                <select
                  className={errors.category ? 'ei-err' : ''}
                  value={data.category}
                  onChange={(e) => update({ category: e.target.value })}
                >
                  <option value="">선택</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="ei-err-msg show">행사 종류를 선택해 주세요.</div>}
              </div>

              <div className="ei-field">
                <label>
                  행사명<span className="ei-req">*</span>
                </label>
                <input
                  type="text"
                  className={errors.evName ? 'ei-err' : ''}
                  value={data.evName}
                  placeholder="예: 2026 한강 가을 축제"
                  onChange={(e) => update({ evName: e.target.value })}
                />
                {errors.evName && <div className="ei-err-msg show">행사명을 입력해 주세요.</div>}
              </div>

              <div className="ei-field">
                <label>
                  행사 장소<span className="ei-req">*</span>
                </label>
                <div className="ei-seg-col">
                  <div className="ei-seg">
                    {(['실외', '실내', '혼합'] as VenueType[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={data.venue === v ? 'on' : ''}
                        onClick={() => update({ venue: v })}
                      >
                        {v === '혼합' ? '실내외 혼합' : v}
                      </button>
                    ))}
                  </div>
                  <div className="ei-seg">
                    {(
                      [
                        ['단일', '단일 장소'],
                        ['복수', '복수 장소'],
                        ['이동', '이동 구간'],
                      ] as [LocationType, string][]
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        className={data.locType === v ? 'on' : ''}
                        onClick={() => update({ locType: v })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {data.locType === '단일' ? (
                  <>
                    <input
                      type="text"
                      className={errors.region ? 'ei-err' : ''}
                      value={data.region}
                      placeholder="행사장 주소를 입력해 주세요. (도로명 주소)"
                      onChange={(e) => update({ region: e.target.value })}
                    />
                    {errors.region && <div className="ei-err-msg show">행사장 주소를 입력해 주세요.</div>}
                  </>
                ) : data.locType === '복수' ? (
                  <>
                    <div className="ei-places">
                      {data.places.map((place, i) => (
                        <div key={i} className="ei-placerow">
                          <input
                            type="text"
                            className={errors.region ? 'ei-err' : ''}
                            value={place}
                            placeholder="행사장 주소를 입력해 주세요. (도로명 주소)"
                            onChange={(e) => {
                              const next = [...data.places];
                              next[i] = e.target.value;
                              update({ places: next });
                            }}
                          />
                          <button
                            type="button"
                            className="ei-place-rm"
                            title="삭제"
                            disabled={data.places.length <= 2}
                            onClick={() => {
                              if (data.places.length <= 2) return;
                              update({ places: data.places.filter((_, idx) => idx !== i) });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="ei-place-add"
                        onClick={() => update({ places: [...data.places, ''] })}
                      >
                        ＋ 장소 추가
                      </button>
                    </div>
                    {errors.region && (
                      <div className="ei-err-msg show">도로명 주소를 최소 2곳 입력해 주세요.</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="ei-route">
                      <input
                        type="text"
                        className={errors.region ? 'ei-err' : ''}
                        value={data.routeFrom}
                        placeholder="출발지 주소를 입력해 주세요. (도로명 주소)"
                        onChange={(e) => update({ routeFrom: e.target.value })}
                      />
                      <input
                        type="text"
                        value={data.routeVia}
                        placeholder="주요 경유지 (선택, 예: 성수대교 남단)"
                        onChange={(e) => update({ routeVia: e.target.value })}
                      />
                      <input
                        type="text"
                        className={errors.region ? 'ei-err' : ''}
                        value={data.routeTo}
                        placeholder="도착지 주소를 입력해 주세요. (도로명 주소)"
                        onChange={(e) => update({ routeTo: e.target.value })}
                      />
                      <textarea
                        rows={2}
                        value={data.moveNote}
                        placeholder="이동수단·구간·도로점용 등 참고사항 (선택)"
                        onChange={(e) => update({ moveNote: e.target.value })}
                      />
                    </div>
                    {errors.region && <div className="ei-err-msg show">출발지와 도착지를 입력해 주세요.</div>}
                    <div className="ei-hint">
                      🚩 이동·행진·순회 행사는 구간·도로점용 등 확인이 필요해 담당자가 별도로 상세 검토합니다.
                    </div>
                  </>
                )}
              </div>

              <div className="ei-field">
                <label>
                  행사 기간<span className="ei-req">*</span>
                </label>
                <div className="ei-period-stack">
                  <div className="ei-period-row">
                    <input
                      type="date"
                      className={errors.date ? 'ei-err' : ''}
                      value={data.startDate}
                      onChange={(e) => update({ startDate: e.target.value })}
                    />
                    <select
                      className={errors.date ? 'ei-err' : ''}
                      value={data.startTime}
                      onChange={(e) => update({ startTime: e.target.value })}
                    >
                      <option value="">시작 시간</option>
                      {TIMES.map((t) => (
                        <option key={t} value={t}>
                          {t}시
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ei-period-row">
                    <input
                      type="date"
                      className={errors.date ? 'ei-err' : ''}
                      value={data.endDate}
                      onChange={(e) => update({ endDate: e.target.value })}
                    />
                    <select
                      className={errors.date ? 'ei-err' : ''}
                      value={data.endTime}
                      onChange={(e) => update({ endTime: e.target.value })}
                    >
                      <option value="">종료 시간</option>
                      {TIMES.map((t) => (
                        <option key={t} value={t}>
                          {t}시
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors.date && <div className="ei-err-msg show">행사 시작일·종료일을 모두 선택해 주세요.</div>}
              </div>

              <div className="ei-field">
                <label>
                  예상 참가인원<span className="ei-req">*</span>{' '}
                  <Tip text="행사기간 전체 동안 예상되는 관객·일반 참가자 수를 입력해 주세요. (예: 하루 1,000명 규모 행사가 10일간 열리면 '10,000명') 행사 관계자·임직원·출연진은 제외하며, 이들은 단체상해보험 또는 단체여행보험으로 별도 가입하시기 바랍니다." />
                </label>
                <div className="ei-suffix">
                  <input
                    type="number"
                    min={1}
                    className={errors.people ? 'ei-err' : ''}
                    value={data.people}
                    placeholder="예: 5000"
                    onChange={(e) => update({ people: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <span className="ei-u">명</span>
                </div>
                {errors.people && <div className="ei-err-msg show">예상 참가인원을 입력해 주세요.</div>}
              </div>

              <div className="ei-field">
                <label>
                  출연진·공연자(가수·무용수·배우 등)가 있나요?{' '}
                  <Tip text="출연진은 관객과 달리 본인 상해가 배상책임으로 보상되지 않을 수 있어, '있음'을 선택하면 담당자가 출연진(공연자) 보상이 가능한 보험사로 안내해 드립니다." />
                </label>
                <div className="ei-seg" style={{ marginBottom: 6 }}>
                  <button type="button" className={data.performer === true ? 'on' : ''} onClick={() => update({ performer: true })}>
                    있음
                  </button>
                  <button type="button" className={data.performer === false ? 'on' : ''} onClick={() => update({ performer: false })}>
                    없음
                  </button>
                </div>
                {data.performer && (
                  <div className="ei-hint">🎤 출연진이 있는 행사는 담당자가 출연진(공연자) 보상이 가능한 보험사로 안내해 드립니다.</div>
                )}
              </div>

              <div className="ei-nav">
                <button className="ei-btn gho" onClick={goPrev}>
                  이전
                </button>
                <button className="ei-btn pri" onClick={goNext}>
                  다음단계
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>행사에 위험요소가 있나요?</h2>
              <p className="ei-desc">해당하는 항목을 선택하면 담당자가 맞춤 담보를 준비합니다.</p>

              <div className="ei-field">
                <label>아래 위험요소 유무를 선택해 주세요</label>
                {RISK_DEFS.map(({ key, label, desc }) => (
                  <div className="ei-rgroup" key={key}>
                    <div className="ei-rrow2">
                      <div className="ei-rl">
                        {label} 유무 <Tip text={desc} />
                      </div>
                      <div className="ei-seg sm">
                        <button type="button" className={data.riskFlags[key] ? 'on' : ''} onClick={() => setRisk(key, true)}>
                          유
                        </button>
                        <button type="button" className={!data.riskFlags[key] ? 'on' : ''} onClick={() => setRisk(key, false)}>
                          무
                        </button>
                      </div>
                    </div>

                    {key === '수상위험' && data.riskFlags.수상위험 && (
                      <div className="ei-rdetail">
                        <div className="ei-rdh">🌊 수상위험 상세정보</div>
                        <div className="ei-rdgrid">
                          <label>
                            수상활동 종류
                            <input
                              value={data.riskDetail.ws.type}
                              placeholder="예: 래프팅·수상레저·선상행사"
                              onChange={(e) => setWaterDetail('type', e.target.value)}
                            />
                          </label>
                          <label>
                            수역 구분
                            <select value={data.riskDetail.ws.area} onChange={(e) => setWaterDetail('area', e.target.value)}>
                              <option value="">선택</option>
                              {['강·하천', '바다', '호수·저수지', '수영장', '워터파크', '기타'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            수상안전요원 배치
                            <select value={data.riskDetail.ws.guard} onChange={(e) => setWaterDetail('guard', e.target.value)}>
                              <option value="">선택</option>
                              {['배치', '미배치'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            구명조끼 등 안전장비
                            <select value={data.riskDetail.ws.gear} onChange={(e) => setWaterDetail('gear', e.target.value)}>
                              <option value="">선택</option>
                              {['구비', '미구비'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="최대 수심·참가 방식 등 참고사항"
                          value={data.riskDetail.ws.note}
                          onChange={(e) => setWaterDetail('note', e.target.value)}
                        />
                      </div>
                    )}

                    {key === '놀이시설' && data.riskFlags.놀이시설 && (
                      <div className="ei-rdetail">
                        <div className="ei-rdh">🎈 놀이시설(에어바운스) 상세정보</div>
                        <div className="ei-rdblk">
                          <div className="ei-rdlbl">
                            시설 종류 <span className="ei-mini">복수 선택 가능</span>
                          </div>
                          <div className="ei-chips">
                            {PLAY_FACILITY_TYPES.map((t) => (
                              <button
                                key={t}
                                type="button"
                                className={`ei-chip ${data.riskDetail.pl.types.includes(t) ? 'on' : ''}`}
                                onClick={() => togglePlType(t)}
                              >
                                {data.riskDetail.pl.types.includes(t) ? '✓ ' : ''}
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        {data.riskDetail.pl.types.includes('기타(직접입력)') && (
                          <div className="ei-rdblk">
                            <div className="ei-rdlbl">기타 시설명 직접 입력</div>
                            <input
                              value={data.riskDetail.pl.typeEtc}
                              placeholder="목록에 없는 시설을 입력해 주세요 (여러 개면 쉼표로 구분)"
                              onChange={(e) => setPlayDetail('typeEtc', e.target.value)}
                            />
                          </div>
                        )}
                        <div className="ei-rdgrid">
                          <label>
                            총 설치 개수
                            <select value={data.riskDetail.pl.cnt} onChange={(e) => setPlayDetail('cnt', e.target.value)}>
                              <option value="">선택</option>
                              {['1개', '2개', '3개', '4개', '5개 이상'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            안전관리인(상주 감독) 배치
                            <select value={data.riskDetail.pl.mgr} onChange={(e) => setPlayDetail('mgr', e.target.value)}>
                              <option value="">선택</option>
                              {['배치', '미배치'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="ei-rdblk">
                          <div className="ei-rdlbl">참고사항</div>
                          <textarea
                            rows={2}
                            placeholder="시설별 개수·이용 연령·안전수칙 등 (예: 에어바운스 2 / 미끄럼틀 1)"
                            value={data.riskDetail.pl.note}
                            onChange={(e) => setPlayDetail('note', e.target.value)}
                          />
                        </div>
                        <div className="ei-rdfile">
                          <label className="ei-fl">
                            시설 사진 첨부{' '}
                            <Tip text="에어바운스 종류·설치 상태·안전관리 확인용. 여러 장 첨부 가능합니다." />
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleAmusementPhotos(e.target.files)}
                          />
                          {data.amusementPhotos.length > 0 && (
                            <div className="ei-hint">첨부됨: {data.amusementPhotos.map((f) => f.name).join(', ')}</div>
                          )}
                          <div className="ei-hint">📷 에어바운스 전경·고정(앵커) 상태가 보이는 사진을 첨부해 주세요. (담당자 안전 확인용)</div>
                        </div>
                      </div>
                    )}

                    {key === '이동행진' && data.riskFlags.이동행진 && (
                      <div className="ei-rdetail">
                        <div className="ei-rdh">🚩 장소 이동·행진·퍼레이드 상세정보</div>
                        <div className="ei-rdgrid">
                          <label>
                            이동 방식
                            <select value={data.riskDetail.mv.mode} onChange={(e) => setMoveDetail('mode', e.target.value)}>
                              <option value="">선택</option>
                              {['도보', '차량', '도보+차량 혼합'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            총 이동 거리
                            <input
                              value={data.riskDetail.mv.dist}
                              placeholder="예: 약 8km"
                              onChange={(e) => setMoveDetail('dist', e.target.value)}
                            />
                          </label>
                          <label>
                            도로점용·교통통제 허가
                            <select value={data.riskDetail.mv.permit} onChange={(e) => setMoveDetail('permit', e.target.value)}>
                              <option value="">선택</option>
                              {['허가 완료', '신청 예정', '불필요'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            안전·질서유지 인력
                            <select value={data.riskDetail.mv.staff} onChange={(e) => setMoveDetail('staff', e.target.value)}>
                              <option value="">선택</option>
                              {['배치', '미배치'].map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="이동 구간(출발·경유·도착)·시간대·차량 통제 구간 등 참고사항"
                          value={data.riskDetail.mv.note}
                          onChange={(e) => setMoveDetail('note', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="ei-hint">해당 항목이 없으면 모두 '무'로 두고 다음 단계로 진행하시면 됩니다.</div>
              </div>

              <div className="ei-nav">
                <button className="ei-btn gho" onClick={goPrev}>
                  이전
                </button>
                <button className="ei-btn pri" onClick={goNext}>
                  다음단계
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>담보 및 보상한도를 선택하세요</h2>
              <p className="ei-desc">담보 유형을 고르거나, 직접입력으로 가입금액을 직접 설정할 수 있습니다.</p>

              <div className="ei-field">
                <label>담보 및 가입금액 선택</label>
                <div className="ei-planwrap three-col">
                  {(['1형', '2형', '직접'] as PlanKey[]).map((k) => (
                    <div key={k} className={`ei-plan ${data.plan === k ? 'sel' : ''}`} onClick={() => setPlan(k)}>
                      <div className="ei-ph">
                        <span className="ei-pn">{planDisplayName(k)}</span>
                        {rec === k && <span className="ei-recb">추천</span>}
                      </div>
                      {k === '1형' && <span className="ei-psub">실속형</span>}
                      {k === '2형' && <span className="ei-psub">표준형</span>}
                    </div>
                  ))}
                </div>
                <div className="ei-hint">
                  💡 이 행사에는 <b>{rec}</b>이(가) 적합할 것으로 보여요. (인원·위험요소 기준 추천)
                </div>
              </div>

              <div className="ei-field">
                <label>{isDirect ? '직접입력 가입금액 선택 구간' : '가입 담보 구성'}</label>
                <table className="ei-covtbl">
                  <thead>
                    <tr>
                      <th className="c1">선택</th>
                      <th className="c2">담보</th>
                      <th>1인당</th>
                      <th>1사고당</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cs">
                        <span className="reqb">필수</span>
                      </td>
                      <td className="cn">
                        대인배상 <Tip text={BASECOV[0].tip} />
                      </td>
                      <td>
                        {isDirect ? (
                          <select value={data.limits.대인1인당} onChange={(e) => setLimit('대인1인당', e.target.value)}>
                            {AMT.대인.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <b>{limits.대인1인당}</b>
                        )}
                      </td>
                      <td>
                        {isDirect ? (
                          <select value={data.limits.대인1사고당} onChange={(e) => setLimit('대인1사고당', e.target.value)}>
                            {AMT.대인.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <b>{limits.대인1사고당}</b>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="cs">
                        <span className="reqb">필수</span>
                      </td>
                      <td className="cn">
                        대물배상 <Tip text={BASECOV[1].tip} />
                      </td>
                      <td className="dash">-</td>
                      <td>
                        {isDirect ? (
                          <select value={data.limits.대물} onChange={(e) => setLimit('대물', e.target.value)}>
                            {AMT.대물.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <b>{limits.대물}</b>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="cs">
                        <span className="reqb">필수</span>
                      </td>
                      <td className="cn">
                        자기부담금 <Tip text={BASECOV[2].tip} />
                      </td>
                      <td className="dash">-</td>
                      <td>
                        {isDirect ? (
                          <select value={data.limits.자기부담금} onChange={(e) => setLimit('자기부담금', e.target.value)}>
                            {AMT.자부.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <b>{limits.자기부담금}</b>
                        )}
                      </td>
                    </tr>

                    {OPTROWS.map((row) => {
                      const on = data.optCov[row.k];
                      const col1 = row.cols.find(([c]) => c === '1인당');
                      const col2 = row.cols.find(([c]) => c === '1사고당');
                      return (
                        <tr key={row.k} className={`optr ${on ? 'on' : ''}`}>
                          <td className="cs">
                            <label className="chk">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleOpt(row.k)}
                              />
                            </label>
                          </td>
                          <td className="cn">
                            {row.k}
                            {row.adv && <span className="adv">특약</span>} <Tip text={row.tip} />
                          </td>
                          <td>
                            {col1 ? (
                              on ? (
                                <select
                                  value={data.optLimits[row.k]['1인당'] || ''}
                                  onChange={(e) => setOptLimit(row.k, '1인당', e.target.value)}
                                >
                                  {AMT[col1[1]].map((o) => (
                                    <option key={o} value={o}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="mut">-</span>
                              )
                            ) : (
                              <span className="dash">-</span>
                            )}
                          </td>
                          <td>
                            {on ? (
                              <>
                                {col2 && (
                                  <select
                                    value={data.optLimits[row.k]['1사고당'] || ''}
                                    onChange={(e) => setOptLimit(row.k, '1사고당', e.target.value)}
                                  >
                                    {AMT[col2[1]].map((o) => (
                                      <option key={o} value={o}>
                                        {o}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {row.ded && (
                                  <div className="dedln">
                                    자기부담금 <b>{data.optLimits[row.k]['자기부담금']}</b>{' '}
                                    <span className="mut" style={{ fontWeight: 400 }}>
                                      자동적용
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="mut">미선택</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="ei-covguide">
                  <div>
                    ✅ <b>참가자치료비</b>는 선택특약이지만, 사고 시 <b>피해자의 과실을 따지지 않고 보상</b>되어 참가자
                    보호와 분쟁 예방에 꼭 필요한 담보입니다.
                  </div>
                  <div>
                    🍱 푸드트럭·푸드박스 등 <b>음식물 제공이 있는 행사</b>는 식중독 등에 대비해 <b>음식물배상</b> 특약
                    가입을 권장합니다.
                  </div>
                </div>

                <div className="ei-hint">선택 특약은 필요한 항목만 체크하고 가입금액을 선택해 주세요.</div>
              </div>

              <div className="ei-note2">
                ※ 제시된 한도는 일반적으로 많이 선택하는 예시이며, 최종 담보·한도는 담당자 상담과 보험회사 약관에
                따라 확정됩니다.
              </div>

              <div className="ei-nav">
                <button className="ei-btn gho" onClick={goPrev}>
                  이전
                </button>
                <button className="ei-btn pri" onClick={goNext}>
                  다음단계
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2>행사주최자 정보 입력</h2>
              <p className="ei-desc">담당자와 연락 및 견적 안내를 위해 정확히 입력해 주세요.</p>

              <div className="ei-two">
                <div className="ei-field">
                  <label>
                    법인(단체)명<span className="ei-req">*</span>
                  </label>
                  <input
                    type="text"
                    className={errors.org ? 'ei-err' : ''}
                    value={data.org}
                    placeholder="예: ○○문화재단 / ○○구청"
                    onChange={(e) => update({ org: e.target.value })}
                  />
                  {errors.org && <div className="ei-err-msg show">법인(단체)명을 입력해 주세요.</div>}
                </div>
                <div className="ei-field">
                  <label>
                    사업자번호<span className="ei-req">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={errors.bizNo ? 'ei-err' : ''}
                    value={data.bizNo}
                    placeholder="예: 000-00-00000"
                    onChange={(e) => update({ bizNo: formatBizNoInput(e.target.value) })}
                  />
                  {errors.bizNo && <div className="ei-err-msg show">사업자번호를 정확히 입력해 주세요.</div>}
                </div>
              </div>

              <div className="ei-two">
                <div className="ei-field">
                  <label>
                    담당자명<span className="ei-req">*</span>
                  </label>
                  <input
                    type="text"
                    className={errors.contact ? 'ei-err' : ''}
                    value={data.contact}
                    placeholder="홍길동"
                    onChange={(e) => update({ contact: e.target.value })}
                  />
                  {errors.contact && <div className="ei-err-msg show">담당자명을 입력해 주세요.</div>}
                </div>
                <div className="ei-field">
                  <label>부서/직책</label>
                  <input
                    type="text"
                    value={data.dept}
                    placeholder="예: 문화사업팀 / 주임"
                    onChange={(e) => update({ dept: e.target.value })}
                  />
                </div>
              </div>

              <div className="ei-two">
                <div className="ei-field">
                  <label>전화번호</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={data.tel}
                    placeholder="예: 02-2261-0098"
                    onChange={(e) => update({ tel: formatTelInput(e.target.value) })}
                  />
                </div>
                <div className="ei-field">
                  <label>
                    휴대폰번호<span className="ei-req">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className={errors.phone ? 'ei-err' : ''}
                    value={data.phone}
                    placeholder="예: 010-1234-5678"
                    onChange={(e) => update({ phone: formatMobileInput(e.target.value) })}
                  />
                  {errors.phone && <div className="ei-err-msg show">휴대폰번호를 정확히 입력해 주세요.</div>}
                </div>
              </div>

              <div className="ei-field">
                <label>
                  이메일<span className="ei-req">*</span>
                </label>
                <input
                  type="email"
                  className={errors.email ? 'ei-err' : ''}
                  value={data.email}
                  placeholder="admin@tourvalley.net"
                  onChange={(e) => update({ email: e.target.value })}
                />
                {errors.email && <div className="ei-err-msg show">이메일을 정확히 입력해 주세요.</div>}
              </div>

              <div className="ei-field">
                <label>행사보험 예산</label>
                <div className="ei-seg" style={{ marginBottom: 8 }}>
                  <button type="button" className={data.budgetType === '정액' ? 'on' : ''} onClick={() => update({ budgetType: '정액' })}>
                    정해진 예산이 있어요
                  </button>
                  <button
                    type="button"
                    className={data.budgetType === '적정' ? 'on' : ''}
                    onClick={() => update({ budgetType: '적정', budgetAmt: '' })}
                  >
                    적정 보험료로 제안받을게요
                  </button>
                </div>
                {data.budgetType === '정액' && (
                  <>
                    <div className="ei-amtwrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={errors.budgetAmt ? 'ei-err' : ''}
                        value={data.budgetAmt}
                        placeholder="예산 금액을 입력해 주세요 (숫자만)"
                        onChange={(e) => update({ budgetAmt: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                      <span className="ei-amtunit">원</span>
                    </div>
                    {errors.budgetAmt && <div className="ei-err-msg show">예산 금액을 입력해 주세요.</div>}
                  </>
                )}
              </div>

              <div className="ei-field">
                <label>첨부서류</label>
                <div className="ei-uplreco">📌 사업자등록증·행사개요서는 견적·청약에 꼭 필요한 서류입니다. 가능하면 함께 첨부해 주세요.</div>
                <div className="ei-upl">
                  <div className="ei-uplrow">
                    <div className="ei-upll">
                      사업자등록증{' '}
                      <Tip text="사업자등록증(또는 고유번호증) 사본입니다. 계약자(단체) 확인 및 청약에 사용됩니다." />
                    </div>
                    <input
                      type="file"
                      accept=".hwp,.hwpx,.pdf,.jpg,.jpeg,.gif,.png,.doc,.docx"
                      onChange={(e) => handleSingleFile('license', e.target.files?.[0])}
                    />
                  </div>
                  <div className="ei-uplrow">
                    <div className="ei-upll">
                      행사개요서{' '}
                      <Tip text="행사명·일정·장소·프로그램·참가규모 등이 담긴 계획서입니다. 위험 검토와 정확한 견적에 도움이 됩니다." />
                    </div>
                    <input
                      type="file"
                      accept=".hwp,.hwpx,.pdf,.jpg,.jpeg,.gif,.png,.doc,.docx"
                      onChange={(e) => handleSingleFile('overview', e.target.files?.[0])}
                    />
                  </div>
                </div>
                <div className="ei-uplnote">
                  📎 첨부 가능: hwp · hwpx · pdf · jpg · gif · png · doc (항목당 1개). 파일이 많거나 업로드가 어려우면
                  이메일(admin@tourvalley.net) 또는 팩스(02-2261-0098)로 보내주셔도 됩니다.
                </div>
              </div>

              <div className="ei-consent">
                <div className="ei-row">
                  <input
                    type="checkbox"
                    checked={data.cPrivacy}
                    onChange={(e) => update({ cPrivacy: e.target.checked })}
                  />
                  <div className="ei-txt">
                    <b>[필수]</b> 개인정보 수집·이용·조회·제공 동의
                    <div className="ei-more">
                      견적 산출·상담·안내 목적으로 연락처·행사정보 및 첨부서류를 수집·이용하며, 보험사 견적 진행을
                      위해 필요한 범위에서 제공·조회됩니다. 목적 달성 후 관계 법령에 따라 파기합니다.
                    </div>
                  </div>
                </div>
              </div>
              <div className="ei-consent">
                <div className="ei-row">
                  <input
                    type="checkbox"
                    checked={data.cMarketing}
                    onChange={(e) => update({ cMarketing: e.target.checked })}
                  />
                  <div className="ei-txt">
                    <b>[선택]</b> 마케팅 정보 수신 동의 (알림톡·문자)
                    <div className="ei-more">견적 안내, 만기·갱신 안내 등을 알림톡·문자로 받아보실 수 있습니다.</div>
                  </div>
                </div>
              </div>
              {errors.consent && <div className="ei-err-msg show">필수 항목(개인정보 수집·이용·조회·제공)에 동의해 주세요.</div>}
              <div className="ei-privguard">🔒 제공하신 정보는 보험료 산출 및 상담 목적으로만 사용되며, 안전하게 관리됩니다.</div>

              <div className="ei-nav">
                <button className="ei-btn gho" onClick={goPrev}>
                  이전
                </button>
                <button className="ei-btn pri" onClick={submitQuote} disabled={submitting}>
                  {submitting ? '신청 중...' : '견적 신청하기'}
                </button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="ei-done">
                <div className="ei-ico">✓</div>
                <h2>견적신청이 접수되었습니다</h2>
                <p>담당자가 내용을 확인한 후 영업일 기준 1일 이내에</p>
                <p>입력하신 연락처로 견적을 안내드리겠습니다.</p>
                <div className="ei-qno">접수번호 {data.contractNumber || '-'}</div>
              </div>

              <div className="ei-rev">
                <div className="ei-rrow">
                  <div className="ei-rk">행사유형</div>
                  <div className="ei-rv">{data.type}</div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">행사명</div>
                  <div className="ei-rv">{data.evName}</div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">종류/장소</div>
                  <div className="ei-rv">
                    {data.category} · {data.venue} · {buildPlaceText(data) || '-'}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">행사기간</div>
                  <div className="ei-rv">
                    {data.startDate} {data.startTime}시 ~ {data.endDate} {data.endTime}시
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">참가인원</div>
                  <div className="ei-rv">{Number(data.people || 0).toLocaleString()}명</div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">출연진·공연자</div>
                  <div className="ei-rv">{data.performer ? '있음 (출연진 보상 가능 보험사 안내)' : '없음'}</div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">위험요소</div>
                  <div className="ei-rv">
                    {RISK_DEFS.filter((r) => data.riskFlags[r.key]).map((r) => r.label).join(', ') || '해당없음'}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">담보/한도</div>
                  <div className="ei-rv">
                    [{planDisplayName(data.plan)}] 대인 1인 {limits.대인1인당}/1사고 {limits.대인1사고당} · 대물{' '}
                    {limits.대물} · 자부 {limits.자기부담금}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">선택특약</div>
                  <div className="ei-rv">
                    {(Object.keys(data.optCov) as OptCovKey[])
                      .filter((k) => data.optCov[k])
                      .map((k) => optCovSummaryLabel(data, k))
                      .join(', ') || '없음'}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">주최자</div>
                  <div className="ei-rv">
                    {data.org}
                    {data.bizNo ? ` (${data.bizNo})` : ''}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">담당자</div>
                  <div className="ei-rv">
                    {data.contact}
                    {data.dept ? ' · ' + data.dept : ''} · {data.phone}
                    {data.tel ? ' / ' + data.tel : ''} · {data.email}
                  </div>
                </div>
                <div className="ei-rrow">
                  <div className="ei-rk">예산</div>
                  <div className="ei-rv">
                    {data.budgetType === '정액' && data.budgetAmt
                      ? Number(data.budgetAmt.replace(/\D/g, '')).toLocaleString() + '원'
                      : '적정 보험료 제안 요청'}
                  </div>
                </div>
              </div>

              <div className="ei-steps-next">
                <b>다음 절차 안내</b>
                <br />
                1. 담당자 검토 → 2. 견적서 발행 → 3. 알림톡·이메일로 견적 발송 → 4. 가입 결정 시 청약·입금 → 5. 증권
                발행
                <br />
                <span style={{ color: 'var(--sub)' }}>문의: 고객센터 1599-2541</span>
              </div>

              <div className="ei-nav">
                <button className="ei-btn pri" onClick={restart}>
                  새 견적 신청
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
