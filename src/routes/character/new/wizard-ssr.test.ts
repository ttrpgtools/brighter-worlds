import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import NewCharacterLayout from './+layout.svelte';

it('server-renders the character creation layout without browser navigation', () => {
  const result = render(NewCharacterLayout);
  expect(result.body).toContain('Create a Brighter Worlds Character');
});
