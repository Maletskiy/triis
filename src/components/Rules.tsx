import { compactRub } from "../lib/format";
import {
  DEDUCTION_BASE_LIMIT,
  IIS3_PROFIT_EXEMPT_LIMIT,
  NDFL_BRACKETS,
  OLD_IIS_CONTRIBUTION_LIMIT,
  RULES_YEAR,
  iis3MinYears,
} from "../lib/rules";

export default function Rules({ openYear }: { openYear: number }) {
  const minYears = iis3MinYears(openYear);

  return (
    <article className="rules">
      <p className="rules__lead">
        Расчёт по правилам {RULES_YEAR} года. Ниже — то, что реально влияет на цифры.
      </p>

      <section className="rules__block">
        <h3>Вычет на взнос</h3>
        <ul>
          <li>
            База — до <b>{compactRub(DEDUCTION_BASE_LIMIT)}</b> взносов за год. Вносить больше
            можно, но налог вернут только с этой суммы.
          </li>
          <li>
            Возврат — по вашей ставке: 13% → <b>52 000 ₽</b> в год, 15% → <b>60 000 ₽</b>.
          </li>
          <li>
            Вернуть можно не больше НДФЛ, который вы реально заплатили за год. Нет официального
            дохода — нет вычета.
          </li>
          <li>
            Лимит {compactRub(DEDUCTION_BASE_LIMIT)} общий для ИИС-3, ПДС и договоров НПО.
          </li>
        </ul>
      </section>

      <section className="rules__block">
        <h3>Срок владения</h3>
        <ul>
          <li>ИИС-1 и ИИС-2 — 3 года.</li>
          <li>
            ИИС-3, открытый в {openYear} году, — {minYears} лет. Для счетов 2024–2026 годов это
            5 лет, дальше планка растёт на год ежегодно до 10.
          </li>
          <li>
            Закрыли раньше — возвращаете полученные вычеты и платите налог с прибыли. Исключение —
            особые жизненные ситуации вроде дорогостоящего лечения.
          </li>
        </ul>
      </section>

      <section className="rules__block">
        <h3>Налог на прибыль</h3>
        <ul>
          <li>ИИС-2 и ИИС-3 освобождают прибыль от НДФЛ.</li>
          <li>
            У ИИС-3 освобождение ограничено {compactRub(IIS3_PROFIT_EXEMPT_LIMIT)} за весь срок
            владения — с суммы выше налог придётся заплатить.
          </li>
          <li>У ИИС-1 прибыль облагается по двухступенчатой шкале 13 / 15%.</li>
          <li>Дивиденды облагаются всегда — льгота на них не распространяется.</li>
        </ul>
      </section>

      <section className="rules__block">
        <h3>Взносы</h3>
        <ul>
          <li>
            ИИС-1 и ИИС-2 — лимит {compactRub(OLD_IIS_CONTRIBUTION_LIMIT)} в год.
          </li>
          <li>У ИИС-3 лимита взносов нет.</li>
          <li>Можно держать до трёх ИИС-3 одновременно.</li>
        </ul>
      </section>

      <section className="rules__block">
        <h3>НДФЛ {RULES_YEAR}</h3>
        <p className="rules__text">
          Ставка применяется только к сумме превышения порога, поэтому предельная ставка зависит
          от вашего дохода.
        </p>
        <ul className="rules__brackets">
          {NDFL_BRACKETS.map((bracket, index) => (
            <li key={String(bracket.upTo)}>
              <b>{Math.round(bracket.rate * 100)}%</b>
              <span>
                {index === 0
                  ? `до ${compactRub(bracket.upTo)}`
                  : Number.isFinite(bracket.upTo)
                    ? `часть выше ${compactRub(NDFL_BRACKETS[index - 1].upTo)}`
                    : `выше ${compactRub(NDFL_BRACKETS[index - 1].upTo)}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rules__block">
        <h3>Что калькулятор не учитывает</h3>
        <ul>
          <li>Комиссии брокера и фондов, налог на купоны, НДФЛ с дивидендов.</li>
          <li>Возможную смену правил: расчёт по нормам {RULES_YEAR} года.</li>
          <li>Неравномерность взносов внутри года — считается, что взнос делается в начале года.</li>
        </ul>
      </section>

      <p className="rules__sources">
        Источники:{" "}
        <a href="https://investmint.ru/iis3/" target="_blank" rel="noopener noreferrer">
          разбор ИИС-3
        </a>
        ,{" "}
        <a
          href="https://www.nalog.gov.ru/rn26/news/activities_fts/16653428/"
          target="_blank"
          rel="noopener noreferrer"
        >
          ФНС о шкале НДФЛ
        </a>
        . Это не инвестиционная рекомендация.
      </p>
    </article>
  );
}
