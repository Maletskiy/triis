import {
  DEDUCTION_BASE_LIMIT,
  IIS3_PROFIT_EXEMPT_LIMIT,
  OLD_IIS_CONTRIBUTION_LIMIT,
  RULES_YEAR,
} from "../lib/rules";
import { useState } from "react";
import { compactRub } from "../lib/format";
import { Collapse } from "./ui";

/**
 * Текстовый блок под калькулятором. Нужен не для красоты: поисковики
 * и ИИ-краулеры читают страницу без JavaScript, и им нужны связные ответы,
 * а не только подписи к полям. Вопросы отсюда же попадают в разметку
 * FAQPage в index.html — тексты должны совпадать.
 */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Сколько денег вернут по ИИС-3 за год?",
    answer:
      `До 52 000 ₽ при ставке НДФЛ 13% и до 60 000 ₽ при 15%. Вычет считают от взносов за год, но не больше ${compactRub(DEDUCTION_BASE_LIMIT)}, и он ограничен суммой НДФЛ, которую вы заплатили за тот же год. Без официального дохода вычета не будет`,
  },
  {
    question: "Через сколько лет можно закрыть ИИС-3?",
    answer:
      "Если счёт открыт в 2024–2026 годах — через 5 лет. Дальше минимальный срок растёт на год ежегодно и доходит до 10 лет. Для счетов типа А и типа Б срок 3 года",
  },
  {
    question: "Чем ИИС-3 отличается от типа А и типа Б?",
    answer:
      "ИИС-3 даёт и вычет на взнос, и освобождение прибыли от налога, но требует владеть счётом 5–10 лет и ограничивает освобождение суммой 30 млн ₽. Тип А — бывший ИИС-1: только вычет на взнос, 3 года, взносы до 1 млн ₽ в год. Тип Б — бывший ИИС-2: только освобождение прибыли, 3 года. Новые счета типов А и Б с 2024 года не открывают",
  },
  {
    question: "Нужно ли платить налог при закрытии ИИС-3?",
    answer: `Прибыль освобождена от НДФЛ, если укладывается в ${compactRub(IIS3_PROFIT_EXEMPT_LIMIT)} за весь срок владения. С суммы выше налог придётся заплатить. Дивиденды облагаются всегда — льгота на них не распространяется`,
  },
  {
    question: "Что будет, если закрыть счёт раньше срока?",
    answer:
      "Полученные вычеты придётся вернуть, а с прибыли заплатить НДФЛ. Исключение — особые жизненные ситуации, например дорогостоящее лечение",
  },
  {
    question: "Можно ли открыть несколько ИИС-3?",
    answer: `Да, до трёх одновременно. Лимит вычета ${compactRub(DEDUCTION_BASE_LIMIT)} в год общий для ИИС-3, ПДС и договоров негосударственного пенсионного обеспечения`,
  },
  {
    question: "Калькулятор учитывает инфляцию?",
    answer:
      "Да: инфляция задаётся в параметрах, и рядом с номинальной суммой показывается результат в ценах сегодня",
  },
  {
    question: "Это инвестиционная рекомендация?",
    answer:
      "Нет. Калькулятор показывает арифметику по действующим правилам и не учитывает вашу ситуацию целиком. Решение о счёте принимайте сами или с консультантом",
  },
];

export default function About() {
  // Первый вопрос раскрыт: видно, что ответы есть и как они выглядят.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="about" aria-labelledby="about-title">
      <div className="about__col">
        <h2 className="about__title" id="about-title">
          Что считает калькулятор
        </h2>
        <p className="about__text">
          Калькулятор считает три сценария на одном наборе параметров: ИИС-3, счёт типа А
          и счёт типа Б. Для каждого — вычеты по годам, налог при закрытии, капитал на счёте
          и сумма на руки в ценах сегодня.
        </p>
        <p className="about__text">
          Расчёт идёт по правилам {RULES_YEAR} года: база вычета{" "}
          {compactRub(DEDUCTION_BASE_LIMIT)} в год, прогрессивные ставки НДФЛ, освобождение
          прибыли по ИИС-3 до {compactRub(IIS3_PROFIT_EXEMPT_LIMIT)}, срок владения от 5 лет
          для счетов 2024–2026 годов и лимит взносов{" "}
          {compactRub(OLD_IIS_CONTRIBUTION_LIMIT)} в год для типов А и Б.
        </p>
        <p className="about__text about__text--muted">
          ТРИИС — бесплатный калькулятор, не брокер и не управляющая компания: счета
          не открываем, данные не собираем. Сделано студией Maletskiy Design.
        </p>
      </div>

      <div className="about__col">
        <h2 className="about__title" id="faq-title">
          Частые вопросы
        </h2>
        <div className="faq">
          {FAQ.map((item, index) => {
            const open = openIndex === index;
            return (
              <div className={"faq__item" + (open ? " is-open" : "")} key={item.question}>
                <h3 className="faq__heading">
                  <button
                    type="button"
                    className="faq__toggle"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span className="faq__question">{item.question}</span>
                    <svg
                      className="faq__chevron"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </h3>
                <Collapse open={open}>
                  <p className="faq__answer" id={`faq-panel-${index}`}>
                    {item.answer}
                  </p>
                </Collapse>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
