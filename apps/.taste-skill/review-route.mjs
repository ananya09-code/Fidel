import {readFileSync,writeFileSync} from 'node:fs';
const file='web/src/routes/_app/review.tsx';
let s=readFileSync(file,'utf8').replace('import { ReviewOverview }','import { ReviewHeader, ReviewOverview }');
s=s.replace('return <PageState kind="loading" title="Loading your review words" />;','return <div className="fidel-review"><ReviewHeader /><PageState kind="loading" title="Loading your review words" /></div>;');
s=s.replace('return <PageState kind="error" title="Couldn\'t load reviews" description={overview.error?.message ?? "No review data was returned."} actionLabel="Try again" onAction={() => void overview.refetch()} />;', 'return <div className="fidel-review"><ReviewHeader /><PageState kind="error" title="Couldn\'t load reviews" description={overview.error?.message ?? "No review data was returned."} actionLabel="Try again" onAction={() => void overview.refetch()} /></div>;');
writeFileSync(file,s);
