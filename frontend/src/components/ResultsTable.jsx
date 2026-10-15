import Badge from "./Badge";
import { priorityKind, typeKind } from "../utils/format";

function List({ items, ordered }) {
  if (items.length === 0) return <span className="muted">None</span>;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </Tag>
  );
}

export default function ResultsTable({ testCases }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Preconditions</th>
            <th scope="col">Test steps</th>
            <th scope="col">Expected result</th>
            <th scope="col">Priority</th>
            <th scope="col">Type</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc) => (
            <tr key={tc.test_case_id} className={`row-${typeKind(tc.test_type)}`}>
              <td data-label="ID" className="cell-id">{tc.test_case_id}</td>
              <td data-label="Title" className="cell-title">{tc.title}</td>
              <td data-label="Preconditions"><List items={tc.preconditions} /></td>
              <td data-label="Test steps"><List items={tc.test_steps} ordered /></td>
              <td data-label="Expected result">{tc.expected_result}</td>
              <td data-label="Priority"><Badge kind={priorityKind(tc.priority)}>{tc.priority}</Badge></td>
              <td data-label="Type"><Badge kind={typeKind(tc.test_type)}>{tc.test_type}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
