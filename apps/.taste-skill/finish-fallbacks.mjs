import {readFileSync,writeFileSync} from 'node:fs';
const f='web/src/routes/__root.tsx';let s=readFileSync(f,'utf8');
s=s.replace('  HeadContent,','  HeadContent,\n  Link,');
s=s.replace('import fidelLogo from "@/assets/fidallogo.png";','import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";\nimport { PageState } from "@/components/common-ui/PageState";\nimport { AuthLoading } from "@/components/auth/AuthLoading";');
s=s.replace('  component: RootComponent,',`  component: RootComponent,
  pendingComponent: AuthLoading,
  notFoundComponent: () => <main className="app-standalone"><FidelTeacherMark className="auth-wait-teacher" /><h1>That page wandered off.</h1><p>Let’s find your way back.</p><Link to="/" className="app-primary">Back to Fidel</Link></main>,
  errorComponent: ({ reset }) => <main className="app-standalone"><h1>A small pause.</h1><PageState kind="error" title="We couldn’t open this page" description="Please try again." actionLabel="Try again" onAction={reset} /><Link to="/" className="app-text-link">Back to Fidel</Link></main>,`);
const start=s.indexOf('function MissingClerkConfig()');
s=s.slice(0,start)+`function MissingClerkConfig() {
  return <main className="app-standalone"><FidelTeacherMark className="auth-wait-teacher" /><h1>Fidel needs a moment of setup.</h1><PageState kind="error" title="Sign-in is not configured" description="Add the Clerk publishable key to the web environment, then restart the app." /></main>;
}
`;
writeFileSync(f,s);
