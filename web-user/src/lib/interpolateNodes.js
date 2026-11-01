import { createElement, Fragment } from 'react';

// "I agree to the {{terms}} and {{privacy}}" + { terms: <a/>, privacy: <a/> } -> React nodes.
export function interpolateNodes(template, nodes) {
  const parts = String(template).split(/(\{\{\s*\w+\s*\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{\s*(\w+)\s*\}\}$/);
    return createElement(Fragment, { key: i }, m && nodes[m[1]] !== undefined ? nodes[m[1]] : part);
  });
}
