import type { AccountResult } from "../lib/calc";
import { rub } from "../lib/format";

export default function YearTable({ result }: { result: AccountResult }) {
  if (result.rows.length === 0) {
    return <p className="table__empty">Пока нет данных для таблицы.</p>;
  }

  return (
    <div className="table__wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Год</th>
            <th scope="col">Взнос</th>
            <th scope="col">Вычет</th>
            <th scope="col" className="table__hide-sm">
              Доход за год
            </th>
            <th scope="col">Капитал</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              <td>{rub(row.contribution)}</td>
              <td className="table__refund">{row.refund > 0 ? rub(row.refund) : "—"}</td>
              <td className="table__hide-sm">{rub(row.growth)}</td>
              <td className="table__capital">{rub(row.capital)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Итого</td>
            <td>{rub(result.contributions)}</td>
            <td className="table__refund">{rub(result.refunds)}</td>
            <td className="table__hide-sm">{rub(result.profit)}</td>
            <td className="table__capital">{rub(result.grossCapital)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
