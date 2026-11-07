import {readFileSync,writeFileSync} from 'node:fs';
const sidebar='web/src/components/common-ui/AppSideBar.tsx';let s=readFileSync(sidebar,'utf8');
const line=s.split('\n').find(x=>x.includes('tooltip="Profile"'));if(line)s=s.replace(line+'\n'+line,line);writeFileSync(sidebar,s);
const picker='web/src/components/theme/AppearancePicker.tsx';s=readFileSync(picker,'utf8').replace('import "@/components/common-ui/app-ui.css";\n','');writeFileSync(picker,s);
const settings='web/src/components/settings-ui/SettingsOverview.tsx';s=readFileSync(settings,'utf8').replace('draft?.userId === userId ? draft?.settings : preferences.data','draft && draft.userId === userId ? draft.settings : preferences.data');writeFileSync(settings,s);
const file='web/src/routes/onboarding.tsx';s=readFileSync(file,'utf8').replace('import fidelLogo from "@/assets/fidallogo.png";','import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";\nimport { PageState } from "@/components/common-ui/PageState";\nimport "@/components/common-ui/app-ui.css";');
s=s.replace('import { Card } from "@/components/ui/card";','').replace('import { Progress } from "@/components/ui/progress";','').replace('import { Button } from "@/components/ui/button";','').replace('import { AppearancePicker } from "@/components/theme/AppearancePicker";','import { AppearancePicker } from "@/components/theme/AppearancePicker";\nimport { LoaderCircle } from "lucide-react";');
const errorStart=s.indexOf('    return (',s.indexOf('if (preferencesQuery.isError)'));
const errorEnd=s.indexOf('\n  return <OnboardingFlow',errorStart);
s=s.slice(0,errorStart)+`    return <main className="app-standalone"><h1>Let’s get you started</h1><PageState kind="error" title="We couldn’t load your setup" description={preferencesQuery.error.message} actionLabel="Try again" onAction={() => void preferencesQuery.refetch()} /></main>;
  }
`+s.slice(errorEnd);
s=s.replace('  const progress = completed ? 100 : ((step + 1) / steps.length) * 100;','');
s=s.replace(/  const selectedLanguage = languages.find\([\s\S]*?  const selectedLevel = levels.find\([^;]+;\r?\n/,'');
const render=s.indexOf('  return (',s.indexOf('  function handleStartLearning()'));
s=s.slice(0,render)+`
  return <OnboardingView step={step} data={data} completed={completed} canContinue={Boolean(canContinue)} isSaving={updatePreferences.isPending} error={updatePreferences.error?.message} onBack={handleBack} onContinue={() => void handleContinue()} onStart={handleStartLearning} onLanguage={(language) => setData((current) => ({ ...current, language }))} onLevel={(level) => setData((current) => ({ ...current, level }))} onMotivation={toggleMotivation} onGoal={(dailyGoal) => setData((current) => ({ ...current, dailyGoal }))} onAppearance={(appearance) => { setData((current) => ({ ...current, appearance })); previewAppearance(appearance); }} />;
}

type OnboardingViewProps = {
 step: number; data: OnboardingData; completed: boolean; canContinue: boolean; isSaving?: boolean; error?: string;
 onBack: () => void; onContinue: () => void; onStart: () => void;
 onLanguage: (value: Language) => void; onLevel: (value: Level) => void;
 onMotivation: (value: Motivation) => void; onGoal: (value: DailyGoal) => void; onAppearance: (value: Appearance) => void;
};

export function OnboardingView({ step, data, completed, canContinue, isSaving, error, onBack, onContinue, onStart, onLanguage, onLevel, onMotivation, onGoal, onAppearance }: OnboardingViewProps) {
 const language = languages.find((item) => item.id === data.language);
 const level = levels.find((item) => item.id === data.level);
 return <main className="fidel-onboarding">
  <header className="onboarding-header"><Link to="/" className="app-wordmark" aria-label="Fidel home"><FidelTeacherMark className="app-header-mark" /><span>Fidel<span className="app-wordmark-dot">.</span></span></Link>{!completed && <span>{step + 1} of {steps.length}</span>}</header>
  <div className="onboarding-content">
   {completed ? <section className="onboarding-complete"><FidelTeacherMark className="onboarding-teacher" /><h1>A new conversation starts here.</h1><p>Your learning plan is ready.</p><dl><div><dt>Learning</dt><dd>{language?.name ?? "Your language"}</dd></div><div><dt>Your level</dt><dd>{level?.title ?? "Your level"}</dd></div><div><dt>Daily goal</dt><dd>{data.dailyGoal} words</dd></div></dl><button type="button" className="app-primary" onClick={onStart}>Start learning<ArrowRight size={18} aria-hidden="true" /></button><button type="button" className="app-secondary" onClick={onBack}>Change my answers</button></section> : <>
    <progress className="onboarding-progress" value={step + 1} max={steps.length} aria-label="Setup progress" />
    <header className="onboarding-title"><h1>{steps[step].title}</h1><p>{steps[step].description}</p></header>
    <fieldset className="onboarding-options" disabled={isSaving}><legend className="sr-only">{steps[step].title}</legend>
    {step === 0 && languages.map((item) => <Choice key={item.id} selected={data.language === item.id} title={item.name + (item.id === "am" ? " · " + item.nativeName : "")} description={item.description} onClick={() => onLanguage(item.id)} />)}
    {step === 1 && levels.map((item) => <Choice key={item.id} selected={data.level === item.id} title={item.title} description={item.description} onClick={() => onLevel(item.id)} />)}
    {step === 2 && <><p className="onboarding-select-note">Choose all that feel right.</p>{motivations.map((item) => <Choice key={item.id} selected={data.motivations.includes(item.id)} title={item.title} description={item.description} onClick={() => onMotivation(item.id)} />)}</>}
    {step === 3 && dailyGoals.map((item) => <Choice key={item.id} selected={data.dailyGoal === item.id} title={item.title} description={item.description} onClick={() => onGoal(item.id)} />)}
    {step === 4 && <AppearancePicker value={data.appearance} onChange={onAppearance} />}
    </fieldset>
    {error && <p className="app-error" role="alert">{error}</p>}
    <div className="onboarding-actions"><button type="button" className="app-secondary" onClick={onBack} disabled={step === 0 || isSaving}><ArrowLeft size={17} aria-hidden="true" />Back</button><button type="button" className="app-primary" onClick={onContinue} disabled={!canContinue || isSaving}>{isSaving && <LoaderCircle size={17} className="app-spinner" aria-hidden="true" />}{step === steps.length - 1 ? "Finish setup" : "Continue"}<ArrowRight size={17} aria-hidden="true" /></button></div>
    <p className="onboarding-note">You can change these choices in Settings.</p>
   </>}
  </div>
 </main>;
}

function Choice({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
 return <button type="button" className="app-choice" aria-pressed={selected} onClick={onClick}><span><strong>{title}</strong><span>{description}</span></span><span className="choice-check" aria-hidden="true">{selected && <Check size={16} />}</span></button>;
}
`;
writeFileSync(file,s);
