import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const realRequire = createRequire(import.meta.url);
function load(path, overrides = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => name in overrides ? overrides[name] : realRequire(name), exports);
  return exports;
}
const batch = {
  id: 'fixture-batch', status: 'failed', language_code: 'om', speaker_id: 'om-hawi', speed: 'normal',
  requested_size: 100, total_selected: 10, generated_count: 0, failed_count: 0,
  pending_review: 0, approved: 0, rejected: 0, complete: true,
  error: 'Speech provider is not configured.',
};
const summary = { running_batch: null, remaining_eligible: 10 };
const Overview = load('../src/components/audio-review/OverviewPanel.tsx').default;
const render = latestBatch => renderToStaticMarkup(React.createElement(Overview, {
  summary, latestBatch, isLoading: false, isStarting: false,
  onStartBatch() {}, onCancelBatch() {}, cancellingBatchId: null,
}));

test('a failed batch with no recordings stays visible after leaving running state', () => {
  const html = render(batch);
  assert.match(html, /Audio generation stopped/);
  assert.match(html, /Speech provider is not configured/);
  assert.doesNotMatch(html, /fully reviewed/);
});

test('per-word failures are visible even when the batch worker completed', () => {
  const html = render({ ...batch, status: 'completed', error: null, failed_count: 10, complete: false });
  assert.match(html, /10 audio generation attempts failed/);
  assert.match(html, /Failed generation/);
});

test('successful batches retain their final result and do not show a failure', () => {
  const html = render({ ...batch, status: 'completed', error: null, generated_count: 10, pending_review: 10, complete: false });
  assert.match(html, /10 recordings/);
  assert.match(html, /waiting for review/);
  assert.doesNotMatch(html, /generation stopped|attempts failed/);
});

function dashboard(data) {
  const queries = [], invalidations = [], effects = [];
  let overviewProps;
  const api = new Proxy({ getAdminKey: () => 'test-only', describeError: error => error.message }, {
    get: (target, key) => target[key] ?? (() => Promise.resolve({})),
  });
  const route = load('../src/routes/admin.audio-review.tsx', {
    react: { ...React, useEffect: effect => effects.push(effect) },
    '@tanstack/react-router': { createFileRoute: () => options => options },
    '@tanstack/react-query': {
      useQueryClient: () => ({ invalidateQueries: input => { invalidations.push(input.queryKey); return Promise.resolve(); } }),
      useMutation: () => ({ isPending: false, mutate() {} }),
      useQuery: options => {
        queries.push(options);
        return options.queryKey[1] === 'batches'
          ? { data, dataUpdatedAt: 42, error: null }
          : { data: undefined, error: null, isLoading: false };
      },
    },
    '@/lib/audioReviewApi': api,
    '@/components/audio-review/OverviewPanel': { __esModule: true, default: props => { overviewProps = props; return null; } },
    '@/components/audio-review/RecordingCard': { __esModule: true, default: () => null },
  });
  renderToStaticMarkup(React.createElement(route.Route.component));
  effects.forEach(effect => effect());
  return { queries, invalidations, overviewProps };
}

test('batch history polls while running and the terminal response refreshes recordings', () => {
  const { queries, invalidations, overviewProps } = dashboard({ running: null, batches: [batch] });
  const query = queries.find(query => query.queryKey[1] === 'batches');
  assert.equal(query.refetchInterval({ state: { data: { running: { status: 'running' } } } }), 3000);
  assert.equal(query.refetchInterval({ state: { data: { running: null } } }), false);
  assert.equal(overviewProps.latestBatch, batch);
  assert.deepEqual(invalidations, [['audio-review', 'recordings'], ['audio-review', 'summary']]);
});
