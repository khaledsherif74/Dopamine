import { mergeDictionaries, sharedDictionaries } from '@dopamine/web-shared';
import { en } from './en.js';
import { ar } from './ar.js';

export const dictionaries = mergeDictionaries(sharedDictionaries, { en, ar });
