import { useCallback, useState } from 'react';
import { readJson, writeJson } from '@dopamine/web-shared';
import { addCanned, normalizeCanned, removeCanned, updateCanned } from './canned.js';

// Per-agent, per-browser. Never contains customer data, only the agent's own reusable text.
const KEY = 'dopamine.support.canned';

export function useCanned() {
  const [list, setList] = useState(() => normalizeCanned(readJson(KEY, [])));

  const commit = useCallback(next => {
    setList(next);
    writeJson(KEY, next);
  }, []);

  return {
    list,
    add: input => {
      const r = addCanned(list, input);
      if (r.ok) commit(r.list);
      return r;
    },
    update: (id, input) => {
      const r = updateCanned(list, id, input);
      if (r.ok) commit(r.list);
      return r;
    },
    remove: id => commit(removeCanned(list, id)),
  };
}
