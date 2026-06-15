'use client';

import React, { useState } from 'react';

type MedicalExpenseView = 'silsok' | 'bisilsok';

const COVERAGE_TABLE_COLGROUP = (
  <colgroup>
    <col width="9%" />
    <col width="17%" />
    <col width="9%" />
    <col width="9%" />
    <col width="9%" />
    <col width="9%" />
    <col width="9%" />
    <col width="9%" />
  </colgroup>
);

function MedicalExpenseIncludedTable() {
  return (
    <table className="specialB" border={1} cellSpacing="0">
      <caption></caption>
      {COVERAGE_TABLE_COLGROUP}
      <tbody>
        <tr>
          <td colSpan={2} className="sName ag_left">플랜명</td>
          <td className="sName ag_center">
            <strong>어린이플랜<br />(국내실손 포함)</strong>
          </td>
          <td className="sName ag_center">
            <strong>실속플랜<br />(국내실손 포함)</strong>
          </td>
          <td className="sName ag_center">
            <strong>표준플랜<br />(국내실손 포함)</strong>
          </td>
          <td className="sName ag_center">
            <strong>고보장플랜<br />(국내실손 포함)</strong>
          </td>
          <td className="sName ag_center">
            <strong>어르신플랜1<br />(국내실손 포함)</strong>
          </td>
          <td className="sName ag_center">
            <strong>어르신플랜2<br />(국내실손 포함)</strong>
          </td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_04">가입연령</td>
          <td className="ag_center bgcolor_04">0~15세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">71~90세</td>
          <td className="ag_center bgcolor_04">91~100세</td>
        </tr>
        <tr>
          <td rowSpan={9} className="ag_left bgcolor_red">상해</td>
          <td className="ag_left bgcolor_red">해외여행중 상해사망후유장해</td>
          <td className="ag_center">-</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">2억원</td>
          <td className="ag_center">3억원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">2,000만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">해외여행중 상해 후유장해</td>
          <td className="ag_center">3억원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">해외상해의료실비<br />(해외치료)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 급여_입원)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 급여_통원)</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">10만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 중증 비급여_입원)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 중증 비급여_통원)</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">10만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 비중증 비급여_입원)</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 비중증 비급여_통원)</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td rowSpan={8} className="ag_left bgcolor_red">질병</td>
          <td className="ag_center bgcolor_red">해외질병의료실비<br />(해외치료)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 급여_입원)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 급여_통원)</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">10만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 중증 비급여_입원)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 중증 비급여_통원)</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">15만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">10만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 비중증 비급여_입원)</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 비중증 비급여_통원)</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">해외여행중 질병사망 및<br />질병 80%이상 후유장해</td>
          <td className="ag_center">-</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td rowSpan={4} className="ag_left bgcolor_red">상해질병</td>
          <td className="ag_left bgcolor_red">
            국내의료비<br />(상해질병중증 3대 비급여_근골격계이학요법_체외충격파치료_도수치료)
          </td>
          <td className="ag_center">350만원</td>
          <td className="ag_center">350만원</td>
          <td className="ag_center">350만원</td>
          <td className="ag_center">350만원</td>
          <td className="ag_center">350만원</td>
          <td className="ag_center">350만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병중증 3대 비급여_주사치료)</td>
          <td className="ag_center">250만원</td>
          <td className="ag_center">250만원</td>
          <td className="ag_center">250만원</td>
          <td className="ag_center">250만원</td>
          <td className="ag_center">250만원</td>
          <td className="ag_center">250만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병중증 3대 비급여_자기공명영상진단)</td>
          <td className="ag_center">300만원</td>
          <td className="ag_center">300만원</td>
          <td className="ag_center">300만원</td>
          <td className="ag_center">300만원</td>
          <td className="ag_center">300만원</td>
          <td className="ag_center">300만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병비중증 비급여_자기공명영상진단)</td>
          <td className="ag_center">200만원</td>
          <td className="ag_center">200만원</td>
          <td className="ag_center">200만원</td>
          <td className="ag_center">200만원</td>
          <td className="ag_center">200만원</td>
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 배상책임(자기부담금 1만원)</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">500만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">
            해외여행중 휴대품손해(분실제외,<br />
            자기부담금 1만원, 보상한도 개당 20만원(단, 이동통신단말기 10만원))
          </td>
          <td className="ag_center">150만원</td>
          <td className="ag_center">80만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">150만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">
            해외여행중 중대사고 구조송환비용<br />(자기부담금: 사고(질병)당 10만원공제)
          </td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">신용카드사용액보상(해외여행중 상해사망)</td>
          <td className="ag_center">-</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 여권분실후 재발급비용</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 중단사고발생 추가비용</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">50만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">항공기 및 수화물 지연에 따른 추가비용</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">40만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">80만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">10만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">출국 항공기 지연(2시간이상 4시간 미만)에 따른 추가비용</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">7만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 식중독입원일당(4일이상 120일한도)</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 특정전염병치료비</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행 상해입원일당(4일이상 30일한도)</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행 질병입원일당(4일이상 30일한도)</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">-</td>
          <td className="ag_center">-</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 항공기납치</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 폭력상해피해 변호사선임비용</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 골절(치아파절제외)진단비(동일사고당 1회한)</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 인질구조비용 및 석방보석금</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
        </tr>
      </tbody>
    </table>
  );
}

function MedicalExpenseExcludedTable() {
  const empty = <td className="ag_center">-</td>;

  return (
    <table className="specialB" border={1} cellSpacing="0">
      <caption></caption>
      {COVERAGE_TABLE_COLGROUP}
      <tbody>
        <tr>
          <td colSpan={2} className="sName ag_left">플랜명</td>
          <td className="sName ag_center">
            <strong>어린이플랜<br />(국내실손 제외)</strong>
          </td>
          <td className="sName ag_center">
            <strong>실속플랜<br />(국내실손 제외)</strong>
          </td>
          <td className="sName ag_center">
            <strong>표준플랜<br />(국내실손 제외)</strong>
          </td>
          <td className="sName ag_center">
            <strong>고보장플랜<br />(국내실손 제외)</strong>
          </td>
          <td className="sName ag_center">
            <strong>어르신플랜1<br />(국내실손 제외)</strong>
          </td>
          <td className="sName ag_center">
            <strong>어르신플랜2<br />(국내실손 제외)</strong>
          </td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_04">가입연령</td>
          <td className="ag_center bgcolor_04">0~15세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">15~70세</td>
          <td className="ag_center bgcolor_04">71~90세</td>
          <td className="ag_center bgcolor_04">91~100세</td>
        </tr>
        <tr>
          <td rowSpan={9} className="ag_left bgcolor_red">상해</td>
          <td className="ag_left bgcolor_red">해외여행중 상해사망후유장해</td>
          {empty}
          <td className="ag_center">1억원</td>
          <td className="ag_center">2억원</td>
          <td className="ag_center">3억원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">2,000만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">해외여행중 상해 후유장해</td>
          <td className="ag_center">3억원</td>
          {empty}
          {empty}
          {empty}
          {empty}
          {empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">해외상해의료실비<br />(해외치료)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 중증 비급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 중증 비급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 비중증 비급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(상해 비중증 비급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td rowSpan={8} className="ag_left bgcolor_red">질병</td>
          <td className="ag_center bgcolor_red">해외질병의료실비<br />(해외치료)</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">1억원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 중증 비급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 중증 비급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 비중증 비급여_입원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_center bgcolor_red">국내의료비<br />(질병 비중증 비급여_통원)</td>
          {empty}{empty}{empty}{empty}{empty}{empty}
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">해외여행중 질병사망 및<br />질병 80%이상 후유장해</td>
          {empty}
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">3,000만원</td>
          <td className="ag_center">3,000만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td rowSpan={4} className="ag_left bgcolor_red">상해질병</td>
          <td className="ag_left bgcolor_red">
            국내의료비<br />(상해질병 중증 3대 비급여_근골격계이학요법_체외충격파)
          </td>
          {empty}{empty}{empty}{empty}{empty}
          <td className="ag_center">350만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병 중증 3대 비급여_주사치료)</td>
          {empty}{empty}{empty}{empty}{empty}
          <td className="ag_center">250만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병 중증 3대 비급여_자기공명영상진단)</td>
          {empty}{empty}{empty}{empty}{empty}
          <td className="ag_center">300만원</td>
        </tr>
        <tr>
          <td className="ag_left bgcolor_red">국내의료비<br />(상해질병 비중증 비급여_자기공명영상진단)</td>
          {empty}{empty}{empty}{empty}{empty}
          <td className="ag_center">200만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 배상책임(자기부담금 1만원)</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">2,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">500만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">
            해외여행중 휴대품손해(분실제외,<br />
            자기부담금 1만원, 보상한도 개당 20만원(단, 이동통신단말기 10만원))
          </td>
          <td className="ag_center">150만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">150만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">
            해외여행중 중대사고 구조송환비용<br />(자기부담금 : 사고(질병)당 10만원공제후 20%)
          </td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
          <td className="ag_center">5,000만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">신용카드사용액보상(해외여행중 상해사망)</td>
          {empty}
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 여권분실후 재발급비용</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
          <td className="ag_center">6만7천원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 중단사고발생 추가비용</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">50만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">항공기 및 수화물 지연에 따른 추가비용</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">80만원</td>
          <td className="ag_center">50만원</td>
          <td className="ag_center">30만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">출국 항공기 지연(2시간이상 4시간 미만)에 따른 추가비용</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">7만원</td>
          <td className="ag_center">10만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 식중독입원일당(4일이상 120일한도)</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          <td className="ag_center">2만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 특정전염병치료비</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행 상해입원일당(4일이상 30일한도)</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행 질병입원일당(4일이상 30일한도)</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          <td className="ag_center">5만원</td>
          {empty}
          {empty}
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 항공기납치</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
          <td className="ag_center">140만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 폭력상해피해 변호사선임비용</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
          <td className="ag_center">1,000만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 골절(치아파절제외)진단비(동일사고당 1회한)</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
          <td className="ag_center">20만원</td>
        </tr>
        <tr>
          <td colSpan={2} className="ag_left bgcolor_red">해외여행중 인질구조비용 및 석방보석금</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
          <td className="ag_center">100만원</td>
        </tr>
      </tbody>
    </table>
  );
}

/** 단체 해외여행보험 step3 — 플랜별 보장내역 안내표 */
export default function PlanCoverageGuideTable() {
  const [medicalExpenseView, setMedicalExpenseView] = useState<MedicalExpenseView>('silsok');

  return (
    <div className="detailView bgcolor_white">
      <div className="detailView bgcolor_white">
        <div
          className="pt10"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
        >
          <h2 className="sub_title ag_left" style={{ margin: 0 }}>플랜별 보장내역</h2>
          <select
            value={medicalExpenseView}
            onChange={(e) => setMedicalExpenseView(e.target.value as MedicalExpenseView)}
            style={{
              minWidth: '120px',
              height: '32px',
              padding: '0 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#fff',
            }}
            aria-label="실손/비실손 선택"
          >
            <option value="silsok">실손</option>
            <option value="bisilsok">비실손</option>
          </select>
        </div>

        {medicalExpenseView === 'silsok' ? <MedicalExpenseIncludedTable /> : <MedicalExpenseExcludedTable />}
      </div>

      <div className="Box_line01 mtb20">
        <p className="txt">
          <span className="font_blue">※ 알아두세요.</span>
        </p>
        <div className="login_Btxt">
          <dl>
            <dd className="font_gray">에이스아메리칸화재해상보험의 해외여행보험 상품입니다.</dd>
            <dd className="font_gray">
              해외여행보험의 주계약은 상해사망 및 후유장해이며 그 외에는 기타특약입니다. 기타특약은 해당특약 가입시에만
              보상받으실 수 있습니다.
            </dd>
            <dd className="font_gray">배상책임, 휴대품손해는 자기부담금 각 1만원입니다.</dd>
            <dd className="font_gray">
              휴대품손해에서 <span className="font_red">휴대품 1개(1조 또는 1쌍)의 보상한도는 20만원</span>
              입니다. <span className="font_red">이동통신단말기(핸드폰, 공단말기 포함)은 보상한도 10만원</span>
              입니다.
            </dd>
            <dd className="font_gray">
              <span className="font_red">(비례보상)실손의료비, 특별비용, 배상책임, 휴대품손해를 보상하는 상품</span>
              은 2개 이상의 보험에 가입하더라도 중복 보상되지 않고{' '}
              <span className="font_red">비례보상됩니다.</span>
            </dd>
            <dd className="font_gray">상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</dd>
            <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
          </dl>
        </div>
      </div>

      {medicalExpenseView === 'silsok' && (
        <div className="Box_line01 mtb20" style={{ marginBottom: '30px' }}>
          <p className="txt">※ 5세대 실손의료보험(국내의료비) 본인부담금 안내</p>
          <div className="login_Btxt pb10 Pslist-copay-intro">
            <dl>
              <dd className="font_gray">급여 의료비 : 본인부담금(본인이 실제로 부담한 금액)의 20%(4세대와 동일)</dd>
              <dd className="font_gray">비급여 의료비는 중증 비급여, 비중증 비급여 의료비로 구분</dd>
              <dd className="font_gray">
                국민건강보험 본인부담금 산정특례 대상 질환 비급여(중증)는 4세대 실손과 동일하게 보상
              </dd>
              <dd className="font_gray">
                국민건강보험 본인부담금 산정특례 대상 질환 이외의 질환은 비중증으로 구분하여 본인부담금을 상향 조정
              </dd>
            </dl>
          </div>
          <table className="Pslist Pslist-copay" border={1} cellSpacing="0">
            <caption></caption>
            <colgroup>
              <col width="10%" />
              <col width="30%" />
              <col width="30%" />
              <col width="30%" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">급여</th>
                <th scope="col">
                  중증 비급여 특약1
                  <span className="Pslist-copay-sub">(산정특례대상 질환 대상)</span>
                </th>
                <th scope="col">
                  비중증 비급여 특약2
                  <span className="Pslist-copay-sub">(산정특례대상질환 이외의 질환)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">입원</th>
                <td>본인부담금의 20%</td>
                <td>본인부담금의 30%</td>
                <td className="font_red">본인부담금의 50%</td>
              </tr>
              <tr>
                <th scope="row">통원</th>
                <td>1회당 2만원 또는 보장대상의료비의 20% 중 큰 금액</td>
                <td>1회당 3만원 또는 보장대상의료비의 30% 중 큰 금액</td>
                <td className="font_red">1회당 5만원 또는 보장대상의료비의 50% 중 큰 금액</td>
              </tr>
              <tr>
                <th scope="row">3대 비급여</th>
                <td />
                <td>1회당 3만원 또는 30% 중 큰 금액</td>
                <td className="font_red">
                  1회당 5만원 또는 보장대상의료비의 50% 중 큰 금액
                  <br />
                  비급여 도수치료, 주사비 보장 제외
                </td>
              </tr>
            </tbody>
          </table>
          <div className="login_Btxt pt10 Pslist-copay-note">
            <dl>
              <dd className="font_gray">
                ※ 산정특례대상질환 : 암, 뇌혈관질환, 심장질환, 중증 화상 등 보건복지부 고시 산정 특례 대상질환을 말합니다.
              </dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
