import {readFileSync,writeFileSync} from 'node:fs';
for(const route of ['settings','profile']){
 const f='web/src/routes/_app/'+route+'.tsx'; let s=readFileSync(f,'utf8');
 s=s.replace('className="w-full min-w-0 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10 xl:px-12"','className="w-full min-w-0"');writeFileSync(f,s);
}
const layout='web/src/routes/_app/route.tsx';let s=readFileSync(layout,'utf8').replace('<SidebarProvider defaultOpen={true}>','<SidebarProvider defaultOpen={true} className="fidel-app">');
s=s.replace(/className="sticky top-0 z-40[^"]*"/,'className="app-topbar"');writeFileSync(layout,s);
const sidebar='web/src/components/common-ui/AppSideBar.tsx';s=readFileSync(sidebar,'utf8');
s=s.replace('BookOpen, House, Library, Settings, Trophy','BookOpen, House, Library, Search, Settings, UserRound');
s=s.replace('url: "/home"','url: "/Home"').replace('url: "/learn"','url: "/Learn"').replace('icon: Trophy','icon: Search');
s=s.replace('pathname === item.url ||','pathname === item.url.toLowerCase() ||').replace('pathname.startsWith(`${item.url}/`)','pathname.startsWith(item.url.toLowerCase() + "/")');
s=s.replace('];\n\nexport function','] as const;\n\nexport function').replace('];\r\n\r\nexport function','] as const;\r\n\r\nexport function');
s=s.replace('to="/"','to="/Home"');
s=s.replace('tooltip="Settings"','tooltip="Settings"\n              isActive={pathname === "/settings"}');
s=s.replace('<Link to="/settings">','<Link to="/settings" aria-current={pathname === "/settings" ? "page" : undefined}>');
s=s.replace('<SidebarMenu className="gap-2">','<SidebarMenu className="gap-2">');
s=s.replace('<SidebarFooter className=', '<SidebarFooter className=');
const marker='        <SidebarMenu>\n          <SidebarMenuItem>';
const markerCR='        <SidebarMenu>\r\n          <SidebarMenuItem>';
const extra='        <SidebarMenu>\n          <SidebarMenuItem><SidebarMenuButton asChild tooltip="Profile" isActive={pathname === "/profile"}><Link to="/profile" aria-current={pathname === "/profile" ? "page" : undefined}><UserRound /><span>Profile</span></Link></SidebarMenuButton></SidebarMenuItem>\n          <SidebarMenuItem>';
s=s.replace(markerCR,extra).replace(marker,extra);
writeFileSync(sidebar,s);
const mobile='web/src/components/common-ui/MobileBottomNavigation.tsx';s=readFileSync(mobile,'utf8').replace('text-[10px]','text-[11px]');writeFileSync(mobile,s);
const calendar='web/src/components/profile-ui/StudyActivityCalendar.tsx';s=readFileSync(calendar,'utf8').replace('className="min-w-0 rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7"','className="profile-activity"').replaceAll('text-[10px]','text-[11px]');writeFileSync(calendar,s);
