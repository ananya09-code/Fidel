import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const realRequire = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const require = name => {
    if (name.endsWith('.css')) return {};
    if (name === '@tanstack/react-router') return {
      createFileRoute: () => options => options,
      Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    };
    if (name === '@/lib/api') return { SESSION_EXPIRED_MESSAGE: 'Session expired' };
    if (name.startsWith('@/')) {
      const relative = name.slice(2);
      if (['lib/languages', 'components/common-ui/FidelTeacherMark', 'components/common-ui/PageState', 'components/theme/AppearancePicker', 'components/install/InstallFidel'].includes(relative)) {
        return load(relative + (relative === 'lib/languages' ? '.ts' : '.tsx'));
      }
      return {};
    }
    return realRequire(name);
  };
  new Function('require', 'exports', code)(require, exports);
  cache.set(path, exports);
  return exports;
}

test('Tigrinya is a validated learner preference with its own native label', () => {
  const { learningLanguageSchema, interfaceLanguageSchema } = load('lib/api/preferences.ts');
  assert.equal(learningLanguageSchema.parse('ti'), 'ti');
  assert.equal(interfaceLanguageSchema.parse('ti'), 'ti');
  assert.equal(learningLanguageSchema.safeParse('unknown').success, false);
  assert.equal(load('lib/languages.ts').languageLabel('ti'), 'ትግርኛ');
});

test('onboarding renders a selectable Tigrinya course in both scripts', () => {
  const { OnboardingView } = load('routes/onboarding.tsx');
  const html = renderToStaticMarkup(React.createElement(OnboardingView, {
    step: 0, data: { language: 'ti', level: null, motivations: [], dailyGoal: 5, appearance: 'light' },
    completed: false, canContinue: true, isSaving: false,
    onBack() {}, onContinue() {}, onStart() {}, onLanguage() {}, onLevel() {}, onMotivation() {}, onGoal() {}, onAppearance() {},
  }));
  assert.match(html, /Tigrinya · ትግርኛ/);
  assert.match(html, /aria-pressed="true"/);
});

test('settings keep Tigrinya selected rather than falling back to Oromo', () => {
  const { SettingsForm } = load('components/settings-ui/SettingsOverview.tsx');
  const html = renderToStaticMarkup(React.createElement(SettingsForm, {
    settings: { learning_language: 'ti', interface_language: 'ti', daily_goal_words: 5, reminders_enabled: false, reminder_time: '19:00', sound_enabled: true, appearance: 'light' },
    onChange() {}, onAppearance() {}, onSave() {}, onSignOut() {}, onDelete() {},
  }));
  assert.equal((html.match(/value="ti" selected=""/g) ?? []).length, 2);
  assert.match(html, /Install Fidel/);
});

test('finished onboarding offers installation after setup', () => {
  const { OnboardingView } = load('routes/onboarding.tsx');
  const html = renderToStaticMarkup(React.createElement(OnboardingView, {
    step: 4, data: { language: 'ti', level: 'beginner', motivations: ['family'], dailyGoal: 5, appearance: 'light' },
    completed: true, canContinue: true,
    onBack() {}, onContinue() {}, onStart() {}, onLanguage() {}, onLevel() {}, onMotivation() {}, onGoal() {}, onAppearance() {},
  }));
  assert.match(html, /Want Fidel on your home screen\?/);
  assert.match(html, /Install Fidel/);
});
